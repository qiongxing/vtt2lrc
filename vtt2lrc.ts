const fs = require('fs');
const path = require('path');

const directoryPath = 'F:\\音色\\RJ01518390 RJ01518391';
const directoryLrcPath = 'F:\\音色\\RJ01363802 RJ01363803\\WAV\\含效果音';
const isExportCurPath = true; // 是否导出当前目录

// 确保输出目录存在
if (!isExportCurPath && !fs.existsSync(directoryLrcPath)) {
    fs.mkdirSync(directoryLrcPath, { recursive: true });
}

// 递归处理文件夹
function processDirectory(inputDir, outputDir = '') {
    const outputDirectory = isExportCurPath ? inputDir : outputDir;
    fs.readdir(inputDir, { withFileTypes: true }, (err, entries) => {
        if (err) {
            console.error(`读取目录失败: ${inputDir}`, err);
            return;
        }

        entries.forEach(entry => {
            const inputPath = path.join(inputDir, entry.name);
            const outputPath = path.join(outputDirectory, entry.name);

            if (entry.isDirectory()) {
                // 如果是文件夹，递归处理
                if (!fs.existsSync(outputPath)) {
                    fs.mkdirSync(outputPath, { recursive: true });
                }
                processDirectory(inputPath, outputPath);
            } else if (entry.isFile() && entry.name.endsWith('.vtt')) {
                // 如果是 .vtt 文件，处理转换
                const base1Name = path.basename(entry.name, '.vtt'); // 去掉 .vtt 扩展名
                const baseName = path.basename(base1Name, '.wav'); // 去掉 .wav 扩展名
                const outFileName = path.join(outputDirectory, `${baseName}.lrc`); // 添加 .lrc 扩展名
                convertVttToLrc(inputPath, outFileName);
            } else {
                console.log(`跳过非vtt文件或无效项: ${inputPath}`);
            }
        });
    });
}

// 转换 VTT 文件为 LRC 文件
function convertVttToLrc(inputFile, outputFile) {
    fs.readFile(inputFile, 'utf-8', (err, data) => {
        if (err) {
            console.error(`读取文件失败: ${inputFile}`, err);
            return;
        }

        try {
            let output = '';
            // 去除括号内容换行，并合并非数字字符间的换行
            data = data.replace(/\n（(.*?)）/g, '（$1）') // 保留括号内容，去除换行
                       .replace(/(\D)\n(\D)/g, '$1$2'); // 合并非数字字符间的换行

            // 判断是否包含编号行格式
            const numberedRegex = /\d+\n\d\d:\d\d:\d\d\.\d+ --> \d\d:\d\d:\d\d\.\d+/;
            if (numberedRegex.test(data)) {
                // 带编号的VTT格式
                output = data.replace('WEBVTT', '')
                             .replace(/(\d+)\n(\d\d:\d\d:\d\d\.\d+) --> (\d\d:\d\d:\d\d\.\d+)\n([\s\S]*?)(?=\n\d|$)/g,
                                      `[$2]$4\n[$3]\n`);
            } else {
                // 无编号的VTT格式
                output = data.replace('WEBVTT', '')
                             .replace(/(\d\d:\d\d:\d\d\.\d+) --> (\d\d:\d\d:\d\d\.\d+)\n(.*?)(?=\n\n|$)/g,
                                      `[$1]$3\n[$2]\n`);
            }

            // 异步写入文件
            fs.writeFile(outputFile, output, err => {
                if (err) {
                    console.error(`写入文件失败: ${outputFile}`, err);
                    return;
                }
                console.log(`文件已写入: ${outputFile}`);
            });
        } catch (error) {
            console.error(`处理文件失败: ${inputFile}`, error);
        }
    });
}

// 开始处理
processDirectory(directoryPath);