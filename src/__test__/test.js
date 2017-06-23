import RawReader from "../main";
import assert from "assert";

const lines = [
	"This is line 1",
	"And this is line 2",
	"But line is very longggggggggggggggggggggggggggggggggg"
];

const filepath = __dirname + "/test.txt";

console.log("Testing: " + filepath);

const testData = new RawReader(filepath, {
	skipEmptyLines: true
});

testData.on("error", () => assert(false));

let lineNo = 0;
testData.on("line", record => {
	assert(lines[lineNo++] === record);
	console.log(`[${lineNo}]: ${record}`);
});

testData.on("end", () => {
	assert(lineNo === 3);
});
