# monitorbg
A program to help stop motion animators use monitors or other screens as a background

## How to use:

1. Make sure you have [node.js installed](https://nodejs.dev/learn/how-to-install-nodejs)
2. Clone this project into your desired directory on the same computer you intend to use DragonFrame on.
3. In your favorite command line, navigate to the directory you cloned it into.
4. Type "NPM install" to install the dependencies. You should only need to do this once.
5. Export an image sequence of the animation you want to use as the background into a folder on your computer. Make sure the folder only contains images!
6. [Find the absolute path of your image sequence folder](https://www.addictivetips.com/windows-tips/get-complete-path-to-a-file-or-folder-on-windows-10/)
7. Type "node server.js"
8. Type "new"
9. Enter the absolute path when prompted.
10. Enter the name of the image sequence you'd like to use when prompted. (case sensitive!)
11. Read the text outputted in the terminal to connect Dragonframe and access the displayed image.
12. An extra step is required if you plan on using the display on devices other than the one running MonitorBG and DragonFrame. You'll need to [allow traffic on port 5000.](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-firewall/create-an-inbound-port-rule)
13. Enjoy watching your monitor display automatically update as you animate.
14. Lots more features coming very soon!
