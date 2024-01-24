
build-ascii:
	npm run uglify -- asciiart/aes.js asciiart/ascii.js \
		-o asciiart/ascii.min.js --compress --mangle --toplevel