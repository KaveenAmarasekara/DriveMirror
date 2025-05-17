// === Code.gs ===

/**
 * Triggered when the add-on is opened in Google Drive.
 */
function onHomepage(e) {
  return buildHomeCard();
}

/**
 * Builds the main home card UI.
 */
function buildHomeCard() {
  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText("<b>Welcome to DriveMirror</b><br>Select source and destination folders to copy."))
    .addWidget(CardService.newTextInput()
      .setFieldName("sourceFolderId")
      .setTitle("Source Folder ID"))
    .addWidget(CardService.newTextInput()
      .setFieldName("destinationFolderId")
      .setTitle("Destination Folder ID"))
    .addWidget(CardService.newTextButton()
      .setText("Start Copy")
      .setOnClickAction(CardService.newAction()
        .setFunctionName("startCopy")));

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("DriveMirror"))
    .addSection(section)
    .build();

  return card;
}

/**
 * Starts the folder copy process.
 */
function startCopy(e) {
  var sourceId = e.commonEventObject.formInputs.sourceFolderId.stringInputs.value[0];
  var destId = e.commonEventObject.formInputs.destinationFolderId.stringInputs.value[0];

  try {
    var sourceFolder = DriveApp.getFolderById(sourceId);
    var destFolder = DriveApp.getFolderById(destId);

    copyFolderContents(sourceFolder, destFolder);

    sendNotification(Session.getActiveUser().getEmail(), sourceFolder.getName(), destFolder.getName());

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(buildSuccessCard()))
      .build();
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(buildErrorCard(error.message)))
      .build();
  }
}

/**
 * Recursively copies contents of one folder to another.
 */
function copyFolderContents(source, dest) {
  var files = source.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    file.makeCopy(file.getName(), dest);
  }

  var folders = source.getFolders();
  while (folders.hasNext()) {
    var sub = folders.next();
    var newSub = dest.createFolder(sub.getName());
    copyFolderContents(sub, newSub);
  }
}

/**
 * Sends email notification to the user.
 */
function sendNotification(email, sourceName, destName) {
  MailApp.sendEmail({
    to: email,
    subject: "DriveMirror: Folder Copy Complete",
    body: `Your folder \"${sourceName}\" was successfully copied to \"${destName}\".`
  });
}

/**
 * Displays a success message card.
 */
function buildSuccessCard() {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Success"))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText("✅ Folder contents copied successfully and email sent.")))
    .build();
}

/**
 * Displays an error message card.
 */
function buildErrorCard(message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Error"))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText("❌ Error: " + message)))
    .build();
}
