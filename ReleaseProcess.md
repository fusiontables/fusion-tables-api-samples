# Introduction #

This is the release process for releasing a version (tag) from development (trunk).

## Using TortoiseSVN ##

If you are using TortoiseSVN, the Windows shell SVN client, here is the simple process:
  * Create a folder under /svn/tags/YourLibName, for example, /svn/tags/keydragzoom, commit. You only need to do it once.
  * In your local file system, select your library at svn/trunk/YourLibName, for example, c:\fusion-tables-api-samples\svn\trunk\FTChartWizard, right click on the folder, select TortoiseSVN --> Branch/tag.
  * A dialog appears, there is a combo box: toURL, type in:
```
https://fusion-tables-api-samples.googlecode.com/svn/tags/YourLibName/VersionName
```
> For example:
```
https://fusion-tables-api-samples.googlecode.com/svn/tags/FTChartWizard/1.0
```
> Note: The default value in the toURL is under trunk, you must change it to tags, otherwise it will be tagged into trunk, causing confusion. You do not have to create the 1.0 folder. The tag process will create for you. You can also create the tag/library folder using the ... button here if you did not do it in first step.
  * There is a radio choice on which version you want to tag. It will automatically figure what's the latest version for your library, you can accept the default. It's not necessary to use the HEAD version.
  * Enter log message. Always a good practice.
  * Hit OK. That's it!
  * You can do an update after commit to bring back the tag to your local file.

## After committing ##

  * Email the mailing list about the new version.
  * Add the library to the the ToolsAndLibraries wiki.
  * Go to Administer->Issues and add a label for your class (e.g. Class-FTChartWizard).