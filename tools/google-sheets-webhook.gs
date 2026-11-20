/**
 * Google Apps Script – Smart Start The Premium School Enquiry Sheet Logger
 * Target Spreadsheet: https://docs.google.com/spreadsheets/d/1wDB6TsH42xViEM7OUykdPXCDcVih235ncTEP6WXhV80/edit
 *
 * SETUP (1 minute):
 * 1. Open the Google Sheet above -> Extensions -> Apps Script.
 * 2. Delete any default code and paste this entire script, then click Save.
 * 3. Click Deploy -> New deployment -> Select type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Click Deploy -> Authorize access -> copy the Web app URL (ends with /exec).
 * 5. Paste that URL into "enquirySheetUrl" in data/site-settings.json (and rebuild/deploy).
 */

var SHEET_NAME = "Enquiries";
var HEADERS = [
  "Timestamp",
  "Parent Name",
  "Phone Number",
  "Programme",
  "Message",
  "Channel",
  "Page / Source"
];

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#0D3B66");
    headerRange.setFontColor("#FFD600");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var sheet = getOrCreateSheet_();
    var ts = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy hh:mm a");
    sheet.appendRow([
      ts,
      String(data.name || "").trim(),
      String(data.phone || "").trim(),
      String(data.programme || "Not specified").trim(),
      String(data.message || "").trim(),
      String(data.channel || "").trim(),
      String(data.source || "").trim()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  getOrCreateSheet_();
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, status: "Smart Start Enquiry Webhook Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

