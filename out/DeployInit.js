"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const xml2js_1 = require("xml2js");
const f = fs;
const deployRoot = 'deploy/';
const srcFolder = 'src/';
const buildFolder = 'build/';
const packagexml = 'package.xml';
const classesFolder = 'classes/';
const componentsFolder = 'components/';
const pagesFolder = 'pages/';
const objectsFolder = 'objects/';
const staticResoueceFolder = 'staticresources/';
const classMember = 'ApexClass';
const componentMember = 'ApexComponent';
const pagesMember = 'ApexPage';
const objectMember = 'CustomObject';
const customFieldMember = 'CustomField';
const staticResourceMember = 'StaticResource';
function getTargetFiles() {
    fs.mkdirsSync(deployRoot + srcFolder);
    var xmlData = fs.readFileSync(srcFolder + packagexml);
    var filesInPkg = {};
    xml2js_1.parseString(xmlData, function (err, result) {
        if (err) {
            console.log('Error happened during parsing package.xml. Error message is : ' + err);
            return;
        }
        var types = result.Package.types;
        if (types) {
            var targetTypes = types.filter(t => { return t.name[0] === classMember || t.name[0] === componentMember || t.name[0] === pagesMember || t.name[0] === objectMember || t.name[0] === customFieldMember || t.name[0] === staticResourceMember; });
            targetTypes.forEach(t => {
                // filesInPkg[t.name[0]] = t.members.toString().split(".")[0];
                filesInPkg[t.name[0]] = t.members;
            });
        }
    });
    return filesInPkg;
}
function copyTargetSrc(filesInPkg) {
    if (filesInPkg.hasOwnProperty(objectMember) || filesInPkg.hasOwnProperty(customFieldMember)) {
        console.log('Start Object Copy');
        fs.mkdirsSync(deployRoot + srcFolder + objectsFolder);
        var objectList = Array();
        if (filesInPkg.hasOwnProperty(objectMember))
            filesInPkg[objectMember].forEach(obj => { objectList.push(obj + '.object'); });
        console.debug(filesInPkg[customFieldMember]);
        if (filesInPkg.hasOwnProperty(customFieldMember))
            filesInPkg[customFieldMember].forEach(field => { objectList.push(field.split('.')[0] + '.object'); });
        console.debug(objectList);
        var objectList = Array.from(new Set(objectList));
        console.debug(objectList);
        copyTargetFiles(objectList, srcFolder + objectsFolder, deployRoot + srcFolder + objectsFolder);
        console.log('Objects were successfully copied');
    }
    if (filesInPkg.hasOwnProperty(classMember)) {
        console.log('Start Class Copy');
        fs.mkdirsSync(deployRoot + srcFolder + classesFolder);
        var classList = new Array();
        filesInPkg[classMember].forEach(cls => {
            classList.push(cls + '.cls');
            classList.push(cls + '.cls-meta.xml');
        });
        copyTargetFiles(classList, srcFolder + classesFolder, deployRoot + srcFolder + classesFolder);
        console.log('Classes were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(componentMember)) {
        console.log('Start Component Copy');
        fs.mkdirsSync(deployRoot + srcFolder + componentsFolder);
        var componentList = new Array();
        filesInPkg[componentMember].forEach(cmp => {
            componentList.push(cmp + '.component');
            componentList.push(cmp + '.component-meta.xml');
        });
        copyTargetFiles(componentList, srcFolder + componentsFolder, deployRoot + srcFolder + componentsFolder);
        console.log('Components were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(pagesMember)) {
        console.log('Start Page Copy');
        fs.mkdirsSync(deployRoot + srcFolder + pagesFolder);
        var pageList = new Array();
        filesInPkg[pagesMember].forEach(pg => {
            pageList.push(pg + '.page');
            pageList.push(pg + '.page-meta.xml');
        });
        copyTargetFiles(pageList, srcFolder + pagesFolder, deployRoot + srcFolder + pagesFolder);
        console.log('Pages were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(staticResourceMember)) {
        console.log('Start Static Resource Copy');
        fs.mkdirsSync(deployRoot + srcFolder + staticResoueceFolder);
        var fileList = fs.readdirSync(srcFolder + staticResoueceFolder);
        var itemList = filesInPkg[staticResourceMember];
        var staticResourceList = new Array();
        fileList.forEach(file => {
            if (itemList.includes(file.split('.')[0]))
                staticResourceList.push(file);
        });
        copyTargetFiles(staticResourceList, srcFolder + staticResoueceFolder, deployRoot + srcFolder + staticResoueceFolder);
        console.log('Static Resources were successfully copied');
    }
}
function copyTargetFiles(files, fromFolder, toFolder) {
    // console.log('toFolder is ' + toFolder);
    // console.log('contents in files : ' + files);
    files.forEach(targetFile => {
        fs.copyFile(fromFolder + targetFile, toFolder + targetFile, (err) => {
            if (err) {
                console.log('File Copy error.' + err);
            }
        });
    });
}
fs.removeSync(deployRoot);
fs.mkdirsSync(deployRoot);
fs.copy(buildFolder, deployRoot + buildFolder, err => {
    if (err)
        return console.error(err);
    return console.log('build folder was successfully copied.');
});
fs.copy(srcFolder + packagexml, deployRoot + srcFolder + packagexml, err => {
    if (err)
        return console.error(err);
    return console.log('package.xml was successfully copied');
});
var filesInPkg = getTargetFiles();
copyTargetSrc(filesInPkg);
//# sourceMappingURL=DeployInit.js.map