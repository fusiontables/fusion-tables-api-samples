# How do I join the project? #

We welcome developers with previous experience programming with the Fusion Tables API to join the project, and we especially love for developers who have already written API libraries and tools to open-source them in our project.

We’re looking for projects that act as either a tool for using Fusion Tables or a library to help use the Fusion Tables API. The projects will also act as samples to help developers learn how to use the API.

To join the project, follow these steps:

  1. Sign the [Google CLA](http://code.google.com/legal/individual-cla-v1.0.html) - scroll down for the easy to sign digital version, no faxing necessary.
  1. Email the Fusion Tables team (googletables-feedback@google.com) with links to code you've developed, and a brief paragraph about why you'd like to contribute to the library.
  1. Wait for us to respond that you've been added to the project (or that we need more info).
  1. If you haven't used SVN or a versioning system in the past, read up on SVN.
  1. Add information about yourself to the DeveloperBios page.
  1. Start contributing!

# Why must I sign a CLA to start contributing? #

We want to guarantee we have the right to use the code you contribute, and that we can release it under the same license (Apache 2) as the existing code. This protects us, and others who then use the code, from claims of copyright or patent infringement. It's important to note that our CLA does not assign copyright, or take away any of your rights to the code you contribute. You are free to sell or license it to others differently than the license we use for the project. The Google CLA simply says that you give us the right to use your code as well. If you do have particular concerns about the CLA or Apache License, please contact us for further clarification.

# How do I add a new tool? #

  1. Decide on the name for your tool, as this will determine the folder and file names. If you're not sure, [email the mailing list](http://groups.google.com/group/fusion-tables-libraries-samples-tools) with some ideas.
  1. Do an authenticated checkout of the whole project.
  1. Create the following folders:
    * /toolname/
    * /toolname/src/
    * /toolname/docs/
    * (optional) /toolname/examples/
  1. /toolname/src/: Put all your code (html, javascript and css, for example) in the /src/ folder. Make sure it follows our coding style (See [Google's style guide](http://groups.google.com/group/fusion-tables-libraries-samples-tools), note that Java should follow standard style guidelines). If you’re using JavaScript, generate the packed version of the JavaScript (you can use [Google’s Closure Compiler](https://developers.google.com/closure/compiler/)).
  1. /toolname/docs/: Create a reference.html file containing directions on how to use your tool.
  1. (optional) /toolname/examples/: Place an examples of your tool here. For example, if your tool generates HTML, place sample HTML files here.
  1. Do an SVN add on the whole /toolname/ folder. Set all the mime-types properly with propset:
```
svn propset svn:mime-type <mime-type> <filename>
```
  1. Do an SVN commit. Wait to hear feedback from the developers in the project.

# How do I add a new library? #

  1. Decide on the name for your library, as this will determine the folder and file names. If you're not sure, email the mailing list with some ideas.
  1. Do an authenticated checkout of the whole project.
  1. Create the following folders:
    * /libraryname/
    * /libraryname/src/
    * /libraryname/docs/
    * /libraryname/examples/
  1. /libraryname/src/: Put the code in the /src/ folder. Make sure it follows our coding style (See [Google's style guide](http://code.google.com/p/google-styleguide/), note that Java should follow standard style guidelines). If you’re using JavaScript, generate the packed version of the JavaScript (For example, use [Google’s Closure Compiler](https://developers.google.com/closure/compiler/)).
  1. /libraryname/docs/: Create a reference.html file containing a reference for your library. Link to any relevant examples in the examples folder (see next step).
  1. /libraryname/examples/: Put examples in the /examples/ folder. There should be one basic example, and any other examples to show other or advanced usage of the library.
  1. Do an SVN add on the whole /libraryname/ folder. Set all the mime-types properly with propset
```
svn propset svn:mime-type <mime-type> <filename>
```
  1. Do an SVN commit. Wait to hear feedback from the developers in the project.

If at any point you have questions, email them to the [mailing list](http://groups.google.com/group/fusion-tables-libraries-samples-tools).

# How do I submit a patch or new feature? #

  1. Do an authenticated checkout of the whole project.
  1. Integrate your patch or add your new feature to the library.
  1. Create an example that demonstrates the new feature or bug fix.
  1. Mark issue as fixed, if there's a relevant issue.
  1. Do an SVN commit. Wait to hear feedback from the developers in the project.

If at any point you have questions, email them to the [mailing list](http://www.google.com/url?q=http%3A%2F%2Fgroups.google.com%2Fgroup%2Ffusion-tables-libraries-samples-tools).