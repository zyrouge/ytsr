const fs = require("fs");
const path = require("path");
const { videoInfo, getFormats, getReadableStream } = require("../dist");

const query = "https://www.youtube.com/watch?v=jzJE2ZSH6Dk";

const main = () => new Promise(async (resolve) => {
    try {
        const info = await videoInfo(query);
        const formats = await getFormats(info.streams);
        // Dont use this condition for livestreams
        const format = formats.find(x => x.fps && x.audioChannels);
        const stream = await getReadableStream(format);

        const filename = `${info.title} - ${info.channel.name}.mp4`.replace(/[^(\w|\d|-| |\.)+]/g, "");
        const file = fs.createWriteStream(path.resolve(__dirname, filename));

        file.on("error", console.error);
        stream.on("error", console.error);

        let started = Date.now(), downloaded = 0;
        stream.on("data", (data) => {
            downloaded += data.length;
            console.log(`Downloaded ${downloaded / 1000}kb`);
        });

        stream.pipe(file);

        stream.on("end", () => {
            console.log(`Downloaded in ${(Date.now() - started) / 1000} seconds!`);
            return resolve();
        });
    } catch (err) {
        if (process.env.NODE_ENV !== "test") {
            console.log(`No result were found for ${query} (${err})`);
            return resolve();
        }
        throw err;
    }
});

module.exports = main;

if (process.env.NODE_ENV !== "test") main();