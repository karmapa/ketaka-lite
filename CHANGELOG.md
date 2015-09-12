<a name="0.1.0"></a>
# 0.1.0 (2015-09-12)

## Bug Fixes

- Sort page numbers in order, valid format page number first then the others.
For example, 1.1a, blah, 1.1b, anyThing would be sorted to 1.1a, 1.1b, anyThing, blah

- Put apply chunk to the bottom, not a modal anymore. This makes user to view the image easier.

- Make the input method toggler smaller in small resolution.


## Features

- Add a new dark theme Zenburn.
![Zenburn Theme](https://raw.githubusercontent.com/kmsheng/ketaka-lite/master/files/documentation/ketaka-lite-zenburn.png)

- Implement zip exporting.

- Auto-fill start keyword if current page is empty and previous page has at least 60 characters.

- Add `npm run build` command to automate the build process
