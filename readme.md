# An url powered paste app

### What is that ?

This app store the text right here into the page url (no data is store server side)

### Software and library use to make this app:

+ [Node.js](https://nodejs.org/en/), Js engine use for the server and the development of this project.
+ [Ace](https://ace.c9.io), Web code editor.
+ [Bootstrap](https://getbootstrap.com), Css library.
+ [Vite](https://vitejs.dev), Front-end development kit.
+ [LZ-String](https://www.npmjs.com/package/lz-string), LZ compression algorithm use to encode data.
+ [ESLint](https://eslint.org), Code quality checking.
+ [Fira Code](https://github.com/tonsky/FiraCode), Monospace font use in the code editor with ligatures related to programming and math.
+ [Xolonium](https://fontlibrary.org/en/font/xolonium), Font use for the nav bar.
+ [Express](https://expressjs.com), Storage server api.
+ [jQuery](https://jquery.com), Ajax communication to a storage server api.
+ [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), Database use to store paste.

### Want more functionality or juste report issues ?

+ [GitHub](https://github.com/AlasDiablo/Paste)

### Who to setup a storage server ?

1. Install [NodeJS 16.17.0 LTS](https://nodejs.org/en/).
2. Clone or download the official GitHub repository
3. Run `npm intall` in the cloned repository to install dependencies.
4. Run `npm run server` in the cloned repository to start the storage server.
5. Get your server ip and use it on the application.

### Changelog

+ 2.0.1
    + Enforce https
+ 2.0.0
    + Add server application to store paste
    + Add client server share option
+ 1.1.0
    + Add file loading option
    + Bad url give the value of the landing page
    + New open source ! (MIT)
+ 1.0.1
    + Fix syntax selector when opening a url with data
    + Add a link on the title to go on the landing page
+ 1.0.0
    + Initial version
