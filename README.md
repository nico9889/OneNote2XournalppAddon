# NotExp

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/F1F52OY0N)

[![Get on Addons Mozilla Online](https://extensionworkshop.com/assets/img/documentation/publish/get-the-addon-178x60px.dad84b42.png)](https://addons.mozilla.org/it/firefox/addon/onenote-to-xournal/)
[![Get on Chrome Web Store](https://github.com/user-attachments/assets/e52c6e4c-10c5-4723-8a6a-014c042e02ea)](https://chromewebstore.google.com/detail/onenote-to-xournal++/lbghdcdjdfngepdkmmemagflaekkmjmf)

[![Translation status](https://hosted.weblate.org/widget/onenote2xournalpp/addon/287x66-grey.png)](https://hosted.weblate.org/engage/onenote2xournalpp/)

This is an addon for browser that permits to convert OneNote notes into Xournal++ XOPP format.

# Motivation
This is an evolution of my [old Python script](https://github.com/nico9889/OneNote2Xournalpp) that did more or less the same thing.
The difference with the Python script is that the addons works directly inside the browser so it can retrieve more data useful (mainly offsets between elements once rendered) to the conversion.

Exporting your note into Xournal++ format can be useful for multiple reason:
* the web version of OneNote is painfully slow;
* OneNote doesn't permit you to export PDF (or, it exports your extremely long note sheet into multiple A4), Xournal does;
* Xournal++ is open source :D

Please note that there's **no way** to convert back your notes or import them again into OneNote.

# How does it work
The addons scans the page looking for the images, pen/highlighter strokes and texts.

Once it founds them, it does a best effort conversion from HTML format to Xournal++ XML format.

The conversion is completely done by your computer, so no data are collected or sent to external servers.

# How to use
There are a few steps that are required to get an optimal result:
* Open the notes that you want to convert
* Scroll the notes down to the bottom. This step is needed because OneNote loads images and strokes lazily, doing that you force it to download them all.
* Scroll the notes up again. This is required because the script uses some position relative data to calculate the actual position of the elements.
* Press the addon button on your Toolbar and click "Export"...

Once the page is converted a "_download_" will start automatically.

The time required for the conversion depends on your computer and the size of your notes.

With a medium size file and a relatively beefy computer it requires no more than a second to export the file, I suppose it should take less than a minute in any other case with some exceptions.

# Development

The plugin is entirely written in TypeScript. It's the first time that I make a browser plugin, so I may have made some mistakes.

To work on the code, you need NPM, then with a terminal

* Clone the repository
```bash
git clone https://github.com/nico9889/NotExp.git
```

* Install the dependencies
```bash 
npm install
```

At this point you are ready to work.

* To build the plugin:
```bash
npm run build
```

This command creates a "dist" directory with the reduced JS file and the assets

* To pack the plugin in a ZIP file:
``` bash
npm run pack
```
This command creates a "web-ext-artifacts" directory with the contents of "dist" zipped, ready to be installed on Firefox.

# Translations
This project has been approved for Hosted Weblate Libre Plan.

You can find information on translations in the dedicated Wiki page: https://github.com/nico9889/NotExp/wiki/Internationalization#weblate
