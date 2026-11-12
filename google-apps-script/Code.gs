/**
 * e-DAM IARE - Google Apps Script Automation Backend
 * Handles Automated Event Management, Google Forms Creation & Response Sync.
 *
 * Security Configuration:
 * Configure API_KEY and VERCEL_WEBHOOK_URL strictly in Script Properties.
 *
 * Quick Setup:
 * 1. Open your Google Sheet -> Extensions -> Apps Script.
 * 2. Replace all code in Code.gs with this file.
 * 3. Select 'setupAll' in the toolbar dropdown and click 'Run'. (Authorize when prompted).
 * 4. Click 'Deploy' -> 'New deployment' (or 'Manage deployments' -> Edit -> New version):
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone  <-- CRITICAL! Must be "Anyone" so the website can communicate with it.
 * 5. Copy the Web App URL into your .env.local as GOOGLE_APPS_SCRIPT_URL.
 */

// ============================================================================
// CONFIGURATION & CREDENTIALS
// ============================================================================
// Shared Secret API Key loaded strictly from Apps Script Properties
function getConfiguredApiKey() {
  return PropertiesService.getScriptProperties().getProperty("API_KEY") || "";
}

// Required Sheet Tab Names
var EVENTS_SHEET_NAME = "Events";
var FORM_REGISTRY_SHEET_NAME = "FormRegistry";
var REGISTRATIONS_SHEET_NAME = "Registrations";
var AUDIT_LOG_SHEET_NAME = "AuditLog";
var FORM_CONFIGURATIONS_SHEET_NAME = "FormConfigurations";

// ============================================================================
// 1. ONE-CLICK INITIALIZATION HELPER
// ============================================================================
/**
 * Run this function once from the Apps Script editor to initialize tabs,
 * properties, and triggers automatically.
 */
function setupAll() {
  var ss = getOrCreateSpreadsheet();
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());

  setupInstallableTrigger();

  Logger.log("=== e-DAM IARE SETUP SUCCESSFUL ===");
  Logger.log("Spreadsheet ID: " + ss.getId());
  Logger.log("Spreadsheet URL: " + ss.getUrl());
  Logger.log("API_KEY configured in Script Properties: " + Boolean(getConfiguredApiKey()));
  Logger.log("All 5 tabs verified: Events, FormRegistry, Registrations, AuditLog, FormConfigurations");
}

// ============================================================================
// 2. HTTP POST & GET ROUTERS
// ============================================================================
/**
 * Handles incoming POST requests from the Next.js server
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty request payload" }, 400);
    }

    var data = JSON.parse(e.postData.contents);
    var requestApiKey = data.apiKey || "";
    var action = data.action || "";
    var payload = data.payload || {};

    // Validate API Secret against Script Properties or default constant
    var expectedApiKey = getConfiguredApiKey();
    if (!expectedApiKey || requestApiKey !== expectedApiKey) {
      return createJsonResponse({ success: false, error: "Unauthorized: Invalid API Key" }, 401);
    }

    var ss = getOrCreateSpreadsheet();

    switch (action) {
      case "ping":
        return createJsonResponse({
          success: true,
          message: "e-DAM IARE Apps Script Connected",
          spreadsheetId: ss.getId(),
          timestamp: new Date().toISOString()
        });

      case "get_events":
        return createJsonResponse({
          success: true,
          events: getAllEvents(ss)
        });

      case "create_event":
        return createJsonResponse(createEventWithForm(ss, payload));

      case "update_event":
        return createJsonResponse(updateEventAndForm(ss, payload));

      case "toggle_registration":
        return createJsonResponse(toggleFormRegistration(ss, payload.id, payload.open));

      case "retry_form_creation":
        return createJsonResponse(retryFormCreation(ss, payload.id));

      case "archive_event":
        return createJsonResponse(archiveEvent(ss, payload.id));

      case "delete_event":
        return createJsonResponse(deleteEvent(ss, payload.id));

      case "get_registrations":
        // Sync any pending form response sheet rows first
        syncFormResponses(ss);
        return createJsonResponse({
          success: true,
          registrations: getRegistrations(ss, payload.eventId)
        });

      case "sync_registrations":
        var syncResult = syncFormResponses(ss);
        return createJsonResponse({
          success: true,
          syncedCount: syncResult.syncedCount,
          registrations: getRegistrations(ss, payload.eventId)
        });

      default:
        logAudit(ss, "unknown_action", "", "failed", "Action not supported: " + action);
        return createJsonResponse({ success: false, error: "Unknown action: " + action }, 400);
    }
  } catch (err) {
    Logger.log("doPost Error: " + err);
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Handles incoming GET requests for health check
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  if (action === "ping") {
    return createJsonResponse({
      success: true,
      service: "e-DAM IARE Google Apps Script Automation API",
      status: "online",
      timestamp: new Date().toISOString()
    });
  }
  return createJsonResponse({ success: false, error: "Unsupported GET action" }, 400);
}

// ============================================================================
// 3. TAB CREATION & SCHEMA INITIALIZATION
// ============================================================================
/**
 * Ensures the 4 required tabs exist with their specified headers
 */
function getOrCreateSpreadsheet() {
  var ss;
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (spreadsheetId) {
    try {
      ss = SpreadsheetApp.openById(spreadsheetId);
    } catch (openErr) {
      Logger.log("Could not open by SPREADSHEET_ID (" + spreadsheetId + "): " + openErr);
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error("No active Google Spreadsheet found. Please run this script bound to a Google Sheet or set SPREADSHEET_ID in Script Properties.");
  }

  // 1. Events Tab
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!eventsSheet) {
    eventsSheet = ss.insertSheet(EVENTS_SHEET_NAME);
    eventsSheet.appendRow([
      "eventId",
      "title",
      "description",
      "date",
      "startTime",
      "endTime",
      "venue",
      "status",
      "registrationStatus",
      "formId",
      "formUrl",
      "createdAt",
      "updatedAt"
    ]);
    eventsSheet.setFrozenRows(1);
    formatHeaderRow(eventsSheet);
  }

  // 2. FormRegistry Tab
  var formRegistrySheet = ss.getSheetByName(FORM_REGISTRY_SHEET_NAME);
  if (!formRegistrySheet) {
    formRegistrySheet = ss.insertSheet(FORM_REGISTRY_SHEET_NAME);
    formRegistrySheet.appendRow([
      "eventId",
      "formId",
      "formUrl",
      "formEditUrl",
      "status",
      "createdAt",
      "updatedAt"
    ]);
    formRegistrySheet.setFrozenRows(1);
    formatHeaderRow(formRegistrySheet);
  }

  // 3. Registrations Tab
  var regSheet = ss.getSheetByName(REGISTRATIONS_SHEET_NAME);
  if (!regSheet) {
    regSheet = ss.insertSheet(REGISTRATIONS_SHEET_NAME);
    regSheet.appendRow([
      "registrationId",
      "eventId",
      "formId",
      "submittedAt",
      "attendeeName",
      "email",
      "phone",
      "answersJson"
    ]);
    regSheet.setFrozenRows(1);
    formatHeaderRow(regSheet);
  }

  // 4. AuditLog Tab
  var auditSheet = ss.getSheetByName(AUDIT_LOG_SHEET_NAME);
  if (!auditSheet) {
    auditSheet = ss.insertSheet(AUDIT_LOG_SHEET_NAME);
    auditSheet.appendRow([
      "timestamp",
      "action",
      "eventId",
      "status",
      "errorMessage"
    ]);
    auditSheet.setFrozenRows(1);
    formatHeaderRow(auditSheet);
  }

  // 5. FormConfigurations Tab
  var configSheet = ss.getSheetByName(FORM_CONFIGURATIONS_SHEET_NAME);
  if (!configSheet) {
    configSheet = ss.insertSheet(FORM_CONFIGURATIONS_SHEET_NAME);
    configSheet.appendRow([
      "eventId",
      "formId",
      "version",
      "questionCount",
      "configJson",
      "settingsJson",
      "lastSyncStatus",
      "lastSyncAt",
      "errorMessage"
    ]);
    configSheet.setFrozenRows(1);
    formatHeaderRow(configSheet);
  }

  return ss;
}

function formatHeaderRow(sheet) {
  try {
    var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    range.setFontWeight("bold");
    range.setBackground("#14213d");
    range.setFontColor("#ffffff");
  } catch (_) {}
}

// ============================================================================
// 4. EVENT & REAL GOOGLE FORM CREATION (FormApp.create)
// ============================================================================
/**
 * Creates a real Google Form in Google Drive, links its destination to this
 * spreadsheet, and writes records to Events, FormRegistry, and AuditLog.
 */
function createEventWithForm(ss, eventData) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var formRegistrySheet = ss.getSheetByName(FORM_REGISTRY_SHEET_NAME);
  var now = new Date().toISOString();

  var eventId = eventData.id || "evt_iare_" + new Date().getTime();
  var title = eventData.title || "Untitled Event";
  var description = eventData.description || "";
  var date = eventData.date || "";
  var time = eventData.time || "";

  var timeParts = time.split("–");
  var startTime = (timeParts[0] || "").trim();
  var endTime = (timeParts[1] || "").trim();
  var venue = eventData.venue || "IARE Campus";
  var status = eventData.status || "upcoming";
  var registrationStatus = eventData.registrationOpen !== false ? "open" : "closed";

  // Idempotency: verify if event already exists
  var existing = findEventRowById(eventsSheet, eventId);
  if (existing) {
    logAudit(ss, "create_event_duplicate", eventId, "skipped", "Event already exists");
    return {
      success: true,
      alreadyExisted: true,
      event: eventRowToObject(existing.rowValues),
      formUrl: existing.rowValues[10] || "",
      message: "Event already exists in Google Sheets."
    };
  }

  var formId = "";
  var formUrl = "";
  var formEditUrl = "";
  var formStatus = "active";
  var formError = "";
  var config = eventData.formConfig;

  // 1. Create Real Google Form via FormApp.create
  try {
    var formTitle = (config && config.formTitle) ? config.formTitle : ("Registration: " + title + " | e-DAM IARE");
    var form = FormApp.create(formTitle);

    var formDescription = (config && config.formDescription)
      ? config.formDescription
      : ((eventData.tagline ? eventData.tagline + "\n\n" : "") +
          description + "\n\n" +
          "📅 Date: " + date + "\n" +
          "⏰ Time: " + time + "\n" +
          "📍 Venue: " + venue + "\n\n" +
          "Organized by: e-DAM Student Chapter, Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad.");

    form.setDescription(formDescription);

    // Apply Form Settings
    if (config && config.settings) {
      if (config.settings.confirmationMessage) {
        form.setConfirmationMessage(config.settings.confirmationMessage);
      }
      if (typeof config.settings.collectEmail === "boolean") {
        form.setCollectEmail(config.settings.collectEmail);
      }
      if (typeof config.settings.limitOneResponsePerUser === "boolean") {
        form.setLimitOneResponsePerUser(config.settings.limitOneResponsePerUser);
      }
      if (typeof config.settings.allowResponseEdits === "boolean") {
        form.setAllowResponseEdits(config.settings.allowResponseEdits);
      }
      if (config.settings.customClosedMessage) {
        form.setCustomClosedFormMessage(config.settings.customClosedMessage);
      }
    } else {
      form.setConfirmationMessage(
        "Thank you for registering for " + title + " with the e-DAM Student Chapter at IARE!\n\n" +
        "Your registration has been successfully recorded. Please check your email for schedule details, prerequisites, and venue instructions."
      );
    }

    form.setAcceptingResponses(registrationStatus === "open");

    // Add Questions from Config or Default Questions
    if (config && config.questions && config.questions.length > 0) {
      for (var q = 0; q < config.questions.length; q++) {
        var questionItem = config.questions[q];
        if (questionItem && questionItem.title) {
          addQuestionItemToForm(form, questionItem);
        }
      }
    } else {
      // Standard Required Registration Questions
      form.addTextItem().setTitle("Full Name").setRequired(true);
      form.addTextItem().setTitle("IARE Roll Number").setRequired(true);
      form.addTextItem().setTitle("Email Address").setRequired(true);
      form.addTextItem().setTitle("Phone Number (WhatsApp)").setRequired(true);

      var deptItem = form.addListItem();
      deptItem.setTitle("Department").setChoiceValues([
        "Computer Science & Engineering (CSE)",
        "CSE - Artificial Intelligence & Machine Learning (CS-AIML)",
        "CSE - Data Science (CS-DS)",
        "Information Technology (IT)",
        "Electronics & Communication Engineering (ECE)",
        "Electrical & Electronics Engineering (EEE)",
        "Mechanical Engineering (ME)",
        "Aeronautical Engineering (AE)",
        "Civil Engineering (CE)"
      ]).setRequired(true);

      var yearItem = form.addMultipleChoiceItem();
      yearItem.setTitle("Year of Study").setChoiceValues([
        "1st Year (B.Tech)",
        "2nd Year (B.Tech)",
        "3rd Year (B.Tech)",
        "4th Year (B.Tech)",
        "Post-Graduate (M.Tech / MBA)"
      ]).setRequired(true);

      form.addTextItem().setTitle("e-DAM International Member ID (Optional)").setRequired(false);

      // Legacy Custom Event-Specific Questions
      if (eventData.registrationQuestions && Array.isArray(eventData.registrationQuestions)) {
        for (var c = 0; c < eventData.registrationQuestions.length; c++) {
          if (eventData.registrationQuestions[c] && eventData.registrationQuestions[c].title) {
            addQuestionItemToForm(form, eventData.registrationQuestions[c]);
          }
        }
      }
    }

    // 2. Link Form Responses to Destination Spreadsheet
    try {
      form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    } catch (destErr) {
      Logger.log("Notice on setDestination: " + destErr);
    }

    formId = form.getId();
    formUrl = form.getPublishedUrl();
    formEditUrl = form.getEditUrl();

    // 3. Store in FormRegistry Tab
    formRegistrySheet.appendRow([
      eventId,
      formId,
      formUrl,
      formEditUrl,
      "active",
      now,
      now
    ]);

    // 4. Store in FormConfigurations Tab
    saveFormConfiguration(ss, eventId, formId, config, "active", "");

    logAudit(ss, "create_form", eventId, "success", "Form ID: " + formId);
  } catch (err) {
    Logger.log("Google Form creation failed: " + err);
    formStatus = "failed";
    formError = err.toString();
    saveFormConfiguration(ss, eventId, "", config, "failed", formError);
    logAudit(ss, "create_form", eventId, "failed", formError);
  }

  // 5. Store in Events Tab
  var eventRow = [
    eventId,
    title,
    description,
    date,
    startTime,
    endTime,
    venue,
    status,
    registrationStatus,
    formId,
    formUrl,
    now,
    now
  ];
  eventsSheet.appendRow(eventRow);
  logAudit(ss, "create_event", eventId, "success", formError ? "Form error: " + formError : "Event created");

  return {
    success: true,
    event: eventRowToObject(eventRow),
    formId: formId,
    formUrl: formUrl,
    formEditUrl: formEditUrl, // only returned over secure server-to-server connection
    formStatus: formStatus,
    formError: formError
  };
}

function addQuestionItemToForm(form, question) {
  try {
    var title = question.title || "Untitled";
    var required = Boolean(question.required);
    var helpText = question.helpText || "";
    var type = question.type || "text";

    if (type === "text") {
      var txt = form.addTextItem().setTitle(title).setRequired(required);
      if (helpText) txt.setHelpText(helpText);
    } else if (type === "paragraph") {
      var para = form.addParagraphTextItem().setTitle(title).setRequired(required);
      if (helpText) para.setHelpText(helpText);
    } else if (type === "multiple_choice") {
      var mc = form.addMultipleChoiceItem().setTitle(title).setRequired(required);
      if (helpText) mc.setHelpText(helpText);
      if (question.options && question.options.length > 0) {
        mc.setChoiceValues(question.options);
      }
    } else if (type === "checkboxes" || type === "checkbox") {
      var cb = form.addCheckboxItem().setTitle(title).setRequired(required);
      if (helpText) cb.setHelpText(helpText);
      if (question.options && question.options.length > 0) {
        cb.setChoiceValues(question.options);
      }
    } else if (type === "dropdown") {
      var dd = form.addListItem().setTitle(title).setRequired(required);
      if (helpText) dd.setHelpText(helpText);
      if (question.options && question.options.length > 0) {
        dd.setChoiceValues(question.options);
      }
    } else if (type === "scale") {
      var sc = form.addScaleItem().setTitle(title).setRequired(required);
      if (helpText) sc.setHelpText(helpText);
      var lower = (question.scaleMin === 0) ? 0 : 1;
      var upper = (question.scaleMax && question.scaleMax >= 3 && question.scaleMax <= 10) ? question.scaleMax : 5;
      sc.setBounds(lower, upper);
      if (question.scaleMinLabel || question.scaleMaxLabel) {
        sc.setLabels(question.scaleMinLabel || "", question.scaleMaxLabel || "");
      }
    } else if (type === "date") {
      var dt = form.addDateItem().setTitle(title).setRequired(required);
      if (helpText) dt.setHelpText(helpText);
      dt.setIncludesYear(true);
    } else if (type === "time") {
      var tm = form.addTimeItem().setTitle(title).setRequired(required);
      if (helpText) tm.setHelpText(helpText);
    } else if (type === "section") {
      var sec = form.addSectionHeaderItem().setTitle(title);
      if (helpText) sec.setHelpText(helpText);
    } else {
      var defaultTxt = form.addTextItem().setTitle(title).setRequired(required);
      if (helpText) defaultTxt.setHelpText(helpText);
    }
  } catch (e) {
    Logger.log("Error adding question item (" + question.title + "): " + e);
  }
}

function saveFormConfiguration(ss, eventId, formId, formConfig, status, errorMsg) {
  try {
    var configSheet = ss.getSheetByName(FORM_CONFIGURATIONS_SHEET_NAME);
    if (!configSheet) return;

    var now = new Date().toISOString();
    var version = (formConfig && formConfig.version) || 1;
    var qCount = (formConfig && formConfig.questions && formConfig.questions.length) || 0;
    var configJson = formConfig ? JSON.stringify(formConfig) : "";
    var settingsJson = (formConfig && formConfig.settings) ? JSON.stringify(formConfig.settings) : "";

    var data = configSheet.getDataRange().getValues();
    var foundRow = -1;
    for (var r = 1; r < data.length; r++) {
      if (data[r][0] === eventId) {
        foundRow = r + 1;
        break;
      }
    }

    var rowVals = [
      eventId,
      formId || "",
      version,
      qCount,
      configJson,
      settingsJson,
      status || "active",
      now,
      errorMsg || ""
    ];

    if (foundRow !== -1) {
      configSheet.getRange(foundRow, 1, 1, rowVals.length).setValues([rowVals]);
    } else {
      configSheet.appendRow(rowVals);
    }
  } catch (e) {
    Logger.log("Notice: error saving form configuration: " + e);
  }
}

// ============================================================================
// 5. UPDATE EVENT & FORM SYNCHRONIZATION
// ============================================================================
function updateEventAndForm(ss, eventData) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var found = findEventRowById(eventsSheet, eventData.id);

  if (!found) {
    return { success: false, error: "Event not found: " + eventData.id };
  }

  var rowIdx = found.rowIndex;
  var current = found.rowValues;
  var formId = current[9]; // column 10 (formId)
  var now = new Date().toISOString();
  var config = eventData.formConfig;

  // Update Form in Google Drive if exists
  if (formId) {
    try {
      var form = FormApp.openById(formId);

      if (config && config.formTitle) {
        form.setTitle(config.formTitle);
      } else if (eventData.title) {
        form.setTitle("Registration: " + eventData.title + " | e-DAM IARE");
      }

      if (config && config.formDescription) {
        form.setDescription(config.formDescription);
      } else if (eventData.description || eventData.date || eventData.time || eventData.venue) {
        var newDesc = (eventData.tagline ? eventData.tagline + "\n\n" : "") +
          (eventData.description || current[2]) + "\n\n" +
          "📅 Date: " + (eventData.date || current[3]) + "\n" +
          "⏰ Time: " + (eventData.time || (current[4] + " – " + current[5])) + "\n" +
          "📍 Venue: " + (eventData.venue || current[6]) + "\n\n" +
          "e-DAM Student Chapter, Institute of Aeronautical Engineering (IARE), Hyderabad.";
        form.setDescription(newDesc);
      }

      // Apply Form Settings
      if (config && config.settings) {
        if (config.settings.confirmationMessage) {
          form.setConfirmationMessage(config.settings.confirmationMessage);
        }
        if (typeof config.settings.collectEmail === "boolean") {
          form.setCollectEmail(config.settings.collectEmail);
        }
        if (typeof config.settings.limitOneResponsePerUser === "boolean") {
          form.setLimitOneResponsePerUser(config.settings.limitOneResponsePerUser);
        }
        if (typeof config.settings.allowResponseEdits === "boolean") {
          form.setAllowResponseEdits(config.settings.allowResponseEdits);
        }
        if (config.settings.customClosedMessage) {
          form.setCustomClosedFormMessage(config.settings.customClosedMessage);
        }
      }

      if (typeof eventData.registrationOpen === "boolean") {
        form.setAcceptingResponses(eventData.registrationOpen);
      }

      // If updated questions are passed in formConfig, safely sync questions on the form
      if (config && config.questions && Array.isArray(config.questions) && config.questions.length > 0) {
        var existingItems = form.getItems();
        for (var it = existingItems.length - 1; it >= 0; it--) {
          form.deleteItem(existingItems[it]);
        }
        for (var qIdx = 0; qIdx < config.questions.length; qIdx++) {
          if (config.questions[qIdx] && config.questions[qIdx].title) {
            addQuestionItemToForm(form, config.questions[qIdx]);
          }
        }
      }

      saveFormConfiguration(ss, eventData.id, formId, config, "updated", "");
    } catch (fErr) {
      Logger.log("Notice: could not update form: " + fErr);
    }
  }

  var timeParts = (eventData.time || (current[4] + " – " + current[5])).split("–");
  var startTime = (timeParts[0] || current[4] || "").trim();
  var endTime = (timeParts[1] || current[5] || "").trim();

  var updatedRow = [
    eventData.id,
    eventData.title !== undefined ? eventData.title : current[1],
    eventData.description !== undefined ? eventData.description : current[2],
    eventData.date !== undefined ? eventData.date : current[3],
    startTime,
    endTime,
    eventData.venue !== undefined ? eventData.venue : current[6],
    eventData.status !== undefined ? eventData.status : current[7],
    eventData.registrationOpen !== undefined ? (eventData.registrationOpen ? "open" : "closed") : current[8],
    formId,
    current[10], // formUrl
    current[11], // createdAt
    now          // updatedAt
  ];

  eventsSheet.getRange(rowIdx, 1, 1, updatedRow.length).setValues([updatedRow]);
  logAudit(ss, "update_event", eventData.id, "success", "");

  return { success: true, event: eventRowToObject(updatedRow) };
}

// ============================================================================
// 6. TOGGLE REGISTRATION & RETRY FORM CREATION
// ============================================================================
function toggleFormRegistration(ss, eventId, open) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var found = findEventRowById(eventsSheet, eventId);

  if (!found) {
    return { success: false, error: "Event not found: " + eventId };
  }

  var rowIdx = found.rowIndex;
  var current = found.rowValues;
  var formId = current[9];
  var now = new Date().toISOString();

  // Toggle real Google Form accepting responses
  if (formId) {
    try {
      var form = FormApp.openById(formId);
      form.setAcceptingResponses(Boolean(open));
    } catch (e) {
      Logger.log("Could not update form acceptance status: " + e);
    }
  }

  eventsSheet.getRange(rowIdx, 9).setValue(open ? "open" : "closed");
  eventsSheet.getRange(rowIdx, 13).setValue(now);
  logAudit(ss, "toggle_registration", eventId, "success", "open: " + open);

  return {
    success: true,
    eventId: eventId,
    registrationOpen: Boolean(open),
    status: open ? "open" : "closed"
  };
}

function retryFormCreation(ss, eventId) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var found = findEventRowById(eventsSheet, eventId);

  if (!found) {
    return { success: false, error: "Event not found: " + eventId };
  }

  var row = found.rowValues;
  var eventData = {
    id: row[0],
    title: row[1],
    description: row[2],
    date: row[3],
    time: row[4] + " – " + row[5],
    venue: row[6],
    registrationOpen: row[8] === "open"
  };

  // Attempt creation
  var result = createEventWithForm(ss, eventData);
  return result;
}

function archiveEvent(ss, eventId) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var found = findEventRowById(eventsSheet, eventId);

  if (!found) {
    return { success: false, error: "Event not found: " + eventId };
  }

  eventsSheet.getRange(found.rowIndex, 8).setValue("archived");
  eventsSheet.getRange(found.rowIndex, 13).setValue(new Date().toISOString());
  logAudit(ss, "archive_event", eventId, "success", "");

  return { success: true, eventId: eventId };
}

function deleteEvent(ss, eventId) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var found = findEventRowById(eventsSheet, eventId);

  if (!found) {
    return { success: false, error: "Event not found: " + eventId };
  }

  var formId = found.rowValues[9]; // column 10 (formId)

  // 1. Close Google Form responses if exists so no new attendees can register
  if (formId) {
    try {
      var form = FormApp.openById(formId);
      form.setAcceptingResponses(false);
      form.setCustomClosedFormMessage("This event has been removed by the chapter administrator.");
    } catch (e) {
      Logger.log("Notice: could not close form on delete: " + e);
    }
  }

  // 2. Delete row from Events sheet
  eventsSheet.deleteRow(found.rowIndex);

  // 3. Delete matching row from FormRegistry if present
  var formRegistrySheet = ss.getSheetByName(FORM_REGISTRY_SHEET_NAME);
  if (formRegistrySheet) {
    var regData = formRegistrySheet.getDataRange().getValues();
    for (var r = 1; r < regData.length; r++) {
      if (regData[r][0] === eventId) {
        formRegistrySheet.deleteRow(r + 1);
        break;
      }
    }
  }

  // 4. Log in AuditLog
  logAudit(ss, "delete_event", eventId, "success", "Permanently deleted event and deactivated form");

  return { success: true, eventId: eventId, message: "Event deleted successfully." };
}

// ============================================================================
// 7. GET EVENTS & GET REGISTRATIONS
// ============================================================================
function getAllEvents(ss) {
  var eventsSheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  var data = eventsSheet.getDataRange().getValues();
  var events = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    events.push(eventRowToObject(row));
  }

  return events;
}

function getRegistrations(ss, eventId) {
  var regSheet = ss.getSheetByName(REGISTRATIONS_SHEET_NAME);
  var data = regSheet.getDataRange().getValues();
  var regs = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    // Filter by eventId if provided
    if (eventId && row[1] !== eventId) continue;

    var answers = safeJsonParse(row[7]) || {};
    var findVal = function(terms) {
      for (var k in answers) {
        var kLower = k.toLowerCase();
        for (var t = 0; t < terms.length; t++) {
          if (kLower.indexOf(terms[t]) !== -1) {
            var val = answers[k];
            return Array.isArray(val) ? val.join(", ") : String(val || "");
          }
        }
      }
      return "";
    };

    var attendeeName = row[4] || findVal(["full name", "name", "leader"]) || "Registered Student";
    var rollNumber = findVal(["roll", "hall ticket", "ht no", "student id", "id number"]) || "—";
    var department = findVal(["department", "branch", "dept"]) || "—";
    var yearOfStudy = findVal(["year of study", "year"]) || "—";
    var edamId = findVal(["edam id", "edam membership", "membership id"]);

    regs.push({
      registrationId: row[0],
      eventId: row[1],
      formId: row[2],
      submittedAt: row[3],
      attendeeName: attendeeName,
      fullName: attendeeName,
      rollNumber: rollNumber,
      department: department,
      yearOfStudy: yearOfStudy,
      edamId: edamId || undefined,
      email: row[5] || findVal(["email", "mail"]) || "—",
      phone: row[6] || findVal(["phone", "mobile", "whatsapp"]) || "—",
      answers: answers
    });
  }

  return regs;
}

// ============================================================================
// 8. FORM SUBMIT TRIGGER & RESPONSE SYNCHRONIZATION
// ============================================================================
/**
 * Installable Form Submit Trigger
 * Automatically invoked when a student submits the Google Form.
 */
function onFormSubmit(e) {
  try {
    var ss = getOrCreateSpreadsheet();
    var regSheet = ss.getSheetByName(REGISTRATIONS_SHEET_NAME);
    var now = new Date().toISOString();
    var regId = "reg_" + new Date().getTime();

    var eventId = "general";
    var formId = "";
    var attendeeName = "";
    var email = "";
    var phone = "";
    var answers = {};

    // 1. From Form Trigger (e.response is FormResponse)
    if (e && e.response) {
      var formResp = e.response;
      formId = e.source ? e.source.getId() : "";
      var items = formResp.getItemResponses();
      for (var i = 0; i < items.length; i++) {
        var t = items[i].getItem().getTitle();
        var resp = items[i].getResponse();
        answers[t] = resp;
      }
      email = formResp.getRespondentEmail() || answers["Email Address"] || answers["Email"] || "";
      attendeeName = answers["Full Name"] || answers["Name"] || "";
      phone = answers["Phone Number (WhatsApp)"] || answers["Phone"] || "";
    }
    // 2. From Spreadsheet Trigger (e.namedValues or e.values)
    else if (e && e.namedValues) {
      for (var k in e.namedValues) {
        answers[k] = e.namedValues[k][0] || "";
      }
      email = answers["Email Address"] || answers["Email"] || "";
      attendeeName = answers["Full Name"] || answers["Name"] || "";
      phone = answers["Phone Number (WhatsApp)"] || answers["Phone"] || "";
    }

    // Match event ID from FormRegistry
    if (formId) {
      var formMap = getFormRegistryMap(ss);
      if (formMap[formId]) {
        eventId = formMap[formId];
      }
    }

    regSheet.appendRow([
      regId,
      eventId,
      formId,
      now,
      attendeeName,
      email,
      phone,
      JSON.stringify(answers)
    ]);

        // Dispatch real-time webhook to Vercel backend if configured
    var webhookUrl = PropertiesService.getScriptProperties().getProperty("VERCEL_WEBHOOK_URL");
    var webhookSecret = getConfiguredApiKey();
    if (webhookUrl && webhookSecret) {
      try {
        UrlFetchApp.fetch(webhookUrl, {
          method: "post",
          contentType: "application/json",
          headers: { "X-Webhook-Secret": webhookSecret },
          payload: JSON.stringify({
            eventId: eventId,
            fullName: attendeeName,
            email: email,
            phone: phone,
            answers: answers
          }),
          muteHttpExceptions: true
        });
      } catch (wErr) {
        Logger.log("Webhook dispatch error: " + wErr);
      }
    }
    logAudit(ss, "on_form_submit", eventId, "success", "Registered: " + email);
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err);
  }
}

/**
 * Synchronizes any responses from linked 'Form Responses' sheets
 * into the main Registrations tab (safe fallback if trigger wasn't run).
 */
function syncFormResponses(ss) {
  var regSheet = ss.getSheetByName(REGISTRATIONS_SHEET_NAME);
  var sheets = ss.getSheets();
  var syncedCount = 0;

  var existingData = regSheet.getDataRange().getValues();
  var existingKeys = {};
  for (var r = 1; r < existingData.length; r++) {
    var key = (existingData[r][4] || "") + "_" + (existingData[r][5] || "");
    existingKeys[key] = true;
  }

  var formMap = getFormRegistryMap(ss);

  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var name = sh.getName();
    if (name.indexOf("Form Responses") === 0 || name.indexOf("Form responses") === 0) {
      var data = sh.getDataRange().getValues();
      if (data.length <= 1) continue;
      var headers = data[0];

      var sheetFormUrl = sh.getFormUrl();
      var formId = sheetFormUrl ? extractFormIdFromUrl(sheetFormUrl) : "";
      var eventId = formMap[formId] || "general";

      for (var row = 1; row < data.length; row++) {
        var rowVals = data[row];
        var timestamp = rowVals[0] ? new Date(rowVals[0]).toISOString() : new Date().toISOString();
        var rowAnswers = {};
        var attendeeName = "";
        var email = "";
        var phone = "";

        for (var col = 1; col < headers.length; col++) {
          var h = String(headers[col]).trim();
          var val = rowVals[col];
          rowAnswers[h] = val;
          var hLower = h.toLowerCase();
          if (hLower.indexOf("name") !== -1 && !attendeeName) attendeeName = String(val);
          if ((hLower.indexOf("email") !== -1 || hLower.indexOf("mail") !== -1) && !email) email = String(val);
          if ((hLower.indexOf("phone") !== -1 || hLower.indexOf("mobile") !== -1 || hLower.indexOf("whatsapp") !== -1) && !phone) phone = String(val);
        }

        var dedupKey = attendeeName + "_" + email;
        if (!existingKeys[dedupKey] && (attendeeName || email)) {
          var regId = "reg_" + new Date().getTime() + "_" + row;
          regSheet.appendRow([
            regId,
            eventId,
            formId,
            timestamp,
            attendeeName,
            email,
            phone,
            JSON.stringify(rowAnswers)
          ]);
          existingKeys[dedupKey] = true;
          syncedCount++;
        }
      }
    }
  }

  return { success: true, syncedCount: syncedCount };
}

// ============================================================================
// 9. AUDIT LOGGING & TRIGGER CREATION
// ============================================================================
function logAudit(ss, action, eventId, status, errorMessage) {
  try {
    var auditSheet = ss.getSheetByName(AUDIT_LOG_SHEET_NAME);
    if (auditSheet) {
      auditSheet.appendRow([
        new Date().toISOString(),
        action || "",
        eventId || "",
        status || "",
        errorMessage || ""
      ]);
    }
  } catch (e) {
    Logger.log("Audit log error: " + e);
  }
}

function setupInstallableTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var exists = false;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === "onFormSubmit") {
        exists = true;
        break;
      }
    }
    if (!exists) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        ScriptApp.newTrigger("onFormSubmit")
          .forSpreadsheet(ss)
          .onFormSubmit()
          .create();
        Logger.log("Installable spreadsheet onFormSubmit trigger created successfully.");
      }
    }
  } catch (e) {
    Logger.log("Trigger setup notice: " + e);
  }
}

// ============================================================================
// 10. UTILITIES
// ============================================================================
function findEventRowById(sheet, eventId) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === eventId) {
      return { rowIndex: i + 1, rowValues: data[i] };
    }
  }
  return null;
}

function getFormRegistryMap(ss) {
  var formRegistrySheet = ss.getSheetByName(FORM_REGISTRY_SHEET_NAME);
  var map = {};
  if (!formRegistrySheet) return map;
  var data = formRegistrySheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var eventId = data[i][0];
    var formId = data[i][1];
    if (formId) {
      map[formId] = eventId;
    }
  }
  return map;
}

function extractFormIdFromUrl(url) {
  if (!url) return "";
  var m = url.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : "";
}

function eventRowToObject(row) {
  var eventId = row[0];
  var title = row[1];
  var desc = row[2];
  var date = row[3];
  var startTime = row[4];
  var endTime = row[5];
  var venue = row[6];
  var status = row[7];
  var regStatus = row[8];
  var formId = row[9];
  var formUrl = row[10];
  var createdAt = row[11];
  var updatedAt = row[12];

  var slug = title ? String(title).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "") : eventId;

  return {
    id: eventId,
    slug: slug,
    title: title,
    tagline: "Technical event organized by e-DAM IARE Student Chapter.",
    category: "Workshop",
    status: status || "upcoming",
    date: date,
    time: (startTime && endTime) ? (startTime + " – " + endTime) : (startTime || "10:00 AM – 01:00 PM IST"),
    venue: venue || "IARE Campus",
    mode: "In-Person",
    description: desc,
    detailedOverview: [desc],
    prerequisites: ["Enrolled IARE student ID card."],
    takeaways: [
      "Participation certificate accredited by e-DAM IARE.",
      "Access to chapter repository and technical resources."
    ],
    speakers: [
      {
        name: "Chapter Technical Leads",
        role: "Technical Coordinator",
        organization: "e-DAM IARE Chapter"
      }
    ],
    registrationDeadline: date,
    registrationOpen: regStatus === "open",
    registrationUrl: formUrl || undefined,
    googleFormId: formId || undefined,
    googleFormUrl: formUrl || undefined,
    formStatus: formId ? "active" : "failed",
    responseCount: 0,
    bannerImage: "/images/events/codesprint.svg",
    capacity: 100,
    featured: false,
    isArchived: status === "archived",
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString()
  };
}

function safeJsonParse(str) {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch (_) {
    return {};
  }
}

function createJsonResponse(data, statusCode) {
  statusCode = statusCode || 200;
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

