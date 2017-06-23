import EventEmitter from "events";
import fs from "fs";
import path from "path";

const DATA = "data";
const END = "end";
const ERROR = "error";
const LINE = "line";
const OPEN = "open";
const UTF8 = "utf8";

console.warn("This package is DEPRECATED. Use nodejs.org/api/readline.html");

export default class extends EventEmitter {
	constructor(uri, options = {}) {
		super();

		this.filepath = path.normalize(uri);

		// init from options or defaults
		this.encoding = options.encoding || UTF8;
		this.skipEmptyLines = options.skipEmptyLines || false;

		this.streamOptions = {
			encoding: this.encoding
		};

		if (options.start) {
			this.streamOptions.start = options.start;
		}

		if (options.end) {
			this.streamOptions.end = options.end;
		}

		this.readStream = null;
		this.lines = [];
		this.lineFragment = "";
		this.paused = false;
		this.end = false;
		this.ended = false;

		setImmediate(() => {
			this.initStream();
		});
	}

	initStream() {
		this.readStream = fs.createReadStream(
			this.filepath,
			this.streamOptions
		);

		this.readStream.on(ERROR, err => {
			this.emit(ERROR, err);
		});

		this.readStream.on(OPEN, () => {
			this.emit(OPEN);
		});

		this.readStream.on(DATA, data => {
			this.readStream.pause();
			this.lines = this.lines.concat(data.split(/(?:\n|\r\n|\r)/g));

			this.lines[0] = this.lineFragment + this.lines[0];
			this.lineFragment = this.lines.pop() || "";

			setImmediate(() => {
				this.nextLine();
			});
		});

		this.readStream.on(END, () => {
			this.end = true;

			setImmediate(() => {
				this.nextLine();
			});
		});
	}

	nextLine() {
		let line;

		if (this.end && this.lineFragment) {
			this.emit(LINE, this.lineFragment);
			this.lineFragment = "";

			if (!this.paused) {
				setImmediate(() => {
					this.terminate();
				});
			}
			return;
		}

		if (this.paused) {
			return;
		}

		if (this.lines.length === 0) {
			if (this.end) {
				this.terminate();
			} else {
				this.readStream.resume();
			}
			return;
		}

		line = this.lines.shift();

		if (!this.skipEmptyLines || line.length > 0) {
			this.emit(LINE, line);
		}

		if (!this.paused) {
			setImmediate(() => {
				this.nextLine();
			});
		}
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;

		setImmediate(() => {
			this.nextLine();
		});
	}

	terminate() {
		if (!this.ended) {
			this.ended = true;
			this.emit(END);
		}
	}

	close() {
		this.readStream.destroy();
		this.end = true;

		setImmediate(() => {
			this.nextLine();
		});
	}
}
