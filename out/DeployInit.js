"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const xml2js_1 = require("xml2js");
const commandLineArgs = require('command-line-args');
const f = fs;
const deployFolder = 'deploy/';
const srcFolder = 'src/';
const buildFolder = 'build/';
const packagexml = 'package.xml';
const classesFolder = 'classes/';
const componentsFolder = 'components/';
const pagesFolder = 'pages/';
const objectsFolder = 'objects/';
const staticResoueceFolder = 'staticresources/';
const pageLayoutFolder = 'layouts/';
const flexiPageFolder = 'flexipages/';
const triggerFolder = 'triggers/';
const reportRootFolder = 'reports/';
const groupFolder = 'groups/';
const permissionSetFolder = 'permissionsets/';
const classMember = 'ApexClass';
const componentMember = 'ApexComponent';
const pagesMember = 'ApexPage';
const objectMember = 'CustomObject';
const customFieldMember = 'CustomField';
const staticResourceMember = 'StaticResource';
const pageLayoutMember = 'Layout';
const flexiPageMember = 'FlexiPage';
const triggerMember = 'ApexTrigger';
const reportMember = 'Report';
const groupMember = 'Group';
const permissionSetMember = 'PermissionSet';
function getTargetFiles(srcRoot, deployRoot) {
    fs.mkdirsSync(deployRoot + deployFolder + srcFolder);
    var xmlData = fs.readFileSync(srcRoot + srcFolder + packagexml);
    var filesInPkg = {};
    xml2js_1.parseString(xmlData, function (err, result) {
        if (err) {
            console.log('Error happened during parsing package.xml. Error message is : ' + err);
            return;
        }
        var types = result.Package.types;
        if (types) {
            var targetTypes = types.filter(t => { return t.name[0] === classMember || t.name[0] === componentMember || t.name[0] === pagesMember || t.name[0] === objectMember || t.name[0] === customFieldMember || t.name[0] === staticResourceMember || t.name[0] === pageLayoutMember || t.name[0] === flexiPageMember || t.name[0] === triggerMember || t.name[0] === reportMember || t.name[0] === groupMember || t.name[0] === permissionSetMember; });
            targetTypes.forEach(t => {
                // filesInPkg[t.name[0]] = t.members.toString().split(".")[0];
                filesInPkg[t.name[0]] = t.members;
            });
        }
    });
    return filesInPkg;
}
function copyTargetSrc(filesInPkg, srcRoot, deployRoot) {
    var fromSrcFolder = srcRoot + srcFolder;
    var targetSrcFolder = deployRoot + deployFolder + srcFolder;
    if (filesInPkg.hasOwnProperty(objectMember)) {
        console.log('Start Object Copy');
        fs.mkdirsSync(targetSrcFolder + objectsFolder);
        var objectList = Array();
        filesInPkg[objectMember].forEach(obj => {
            objectList.push(obj + '.object');
        });
        copyTargetFiles(objectList, fromSrcFolder + objectsFolder, targetSrcFolder + objectsFolder);
        console.log('Objects were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(customFieldMember)) {
        console.log('Start Object for Custom Field Copy');
        if (!fs.existsSync(targetSrcFolder + objectsFolder))
            fs.mkdirsSync(targetSrcFolder + objectsFolder);
        var objectList = Array();
        var fieldsObject = {};
        filesInPkg[customFieldMember].forEach(field => {
            var objectName = field.split('.')[0];
            var fieldName = field.split('.')[1];
            objectList.push(objectName + '.object');
            if (!fieldsObject.hasOwnProperty(objectName))
                fieldsObject[objectName] = Array();
            fieldsObject[objectName].push(fieldName);
        });
        objectList = Array.from(new Set(objectList));
        copyTargetFiles(objectList, fromSrcFolder + objectsFolder, targetSrcFolder + objectsFolder);
        sortOutCustomFields(objectList, fieldsObject, targetSrcFolder + objectsFolder);
        console.log('Objects were successfully copied');
    }
    if (filesInPkg.hasOwnProperty(classMember)) {
        console.log('Start Class Copy');
        fs.mkdirsSync(targetSrcFolder + classesFolder);
        var classList = new Array();
        filesInPkg[classMember].forEach(cls => {
            classList.push(cls + '.cls');
            classList.push(cls + '.cls-meta.xml');
        });
        copyTargetFiles(classList, fromSrcFolder + classesFolder, targetSrcFolder + classesFolder);
        console.log('Classes were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(componentMember)) {
        console.log('Start Component Copy');
        fs.mkdirsSync(targetSrcFolder + componentsFolder);
        var componentList = new Array();
        filesInPkg[componentMember].forEach(cmp => {
            componentList.push(cmp + '.component');
            componentList.push(cmp + '.component-meta.xml');
        });
        copyTargetFiles(componentList, fromSrcFolder + componentsFolder, targetSrcFolder + componentsFolder);
        console.log('Components were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(pagesMember)) {
        console.log('Start Page Copy');
        fs.mkdirsSync(targetSrcFolder + pagesFolder);
        var pageList = new Array();
        filesInPkg[pagesMember].forEach(pg => {
            pageList.push(pg + '.page');
            pageList.push(pg + '.page-meta.xml');
        });
        copyTargetFiles(pageList, fromSrcFolder + pagesFolder, targetSrcFolder + pagesFolder);
        console.log('Pages were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(staticResourceMember)) {
        console.log('Start Static Resource Copy');
        fs.mkdirsSync(targetSrcFolder + staticResoueceFolder);
        var fileList = fs.readdirSync(fromSrcFolder + staticResoueceFolder);
        var itemList = filesInPkg[staticResourceMember];
        var staticResourceList = new Array();
        fileList.forEach(file => {
            if (itemList.includes(file.split('.')[0]))
                staticResourceList.push(file);
        });
        copyTargetFiles(staticResourceList, fromSrcFolder + staticResoueceFolder, targetSrcFolder + staticResoueceFolder);
        console.log('Static Resources were successfully copied');
    }
    if (filesInPkg.hasOwnProperty(pageLayoutMember)) {
        console.log('Start PageLayouts Copy');
        fs.mkdirsSync(targetSrcFolder + pageLayoutFolder);
        var pageLayoutList = Array();
        filesInPkg[pageLayoutMember].forEach(pl => {
            pageLayoutList.push(pl + '.layout');
        });
        copyTargetFiles(pageLayoutList, fromSrcFolder + pageLayoutFolder, targetSrcFolder + pageLayoutFolder);
        console.log('PageLayouts were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(flexiPageMember)) {
        console.log('Start FlexiPages Copy');
        fs.mkdirsSync(targetSrcFolder + flexiPageFolder);
        var flexiPageList = Array();
        filesInPkg[flexiPageMember].forEach(fp => {
            flexiPageList.push(fp + '.flexipage');
        });
        copyTargetFiles(flexiPageList, fromSrcFolder + flexiPageFolder, targetSrcFolder + flexiPageFolder);
        console.log('FlexiPages were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(triggerMember)) {
        console.log('Start Triggers Copy');
        fs.mkdirsSync(targetSrcFolder + triggerFolder);
        var triggerList = Array();
        filesInPkg[triggerMember].forEach(fp => {
            triggerList.push(fp + '.trigger');
            triggerList.push(fp + '.trigger-meta.xml');
        });
        copyTargetFiles(triggerList, fromSrcFolder + triggerFolder, targetSrcFolder + triggerFolder);
        console.log('Triggers were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(reportMember)) {
        console.log('Start Folders/Reports Copy');
        fs.mkdirsSync(targetSrcFolder + reportRootFolder);
        var folderSet = new Set();
        var folderMetaList = new Array();
        var reoprtList = new Array();
        filesInPkg[reportMember].forEach(fp => {
            let elementList = fp.split('/');
            if (elementList.length === 2) {
                folderSet.add(elementList[0]);
                reoprtList.push(fp + '.report');
            }
            else if (elementList.length === 1) {
                folderMetaList.push(fp + '-meta.xml');
            }
        });
        folderSet.forEach(folder => {
            fs.mkdirsSync(targetSrcFolder + reportRootFolder + '/' + folder);
        });
        copyTargetFiles(folderMetaList, fromSrcFolder + reportRootFolder, targetSrcFolder + reportRootFolder);
        copyTargetFiles(reoprtList, fromSrcFolder + reportRootFolder, targetSrcFolder + reportRootFolder);
        console.log('Folders/Reports were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(groupMember)) {
        console.log('Start Groups Copy');
        fs.mkdirsSync(targetSrcFolder + groupFolder);
        var groupList = Array();
        filesInPkg[groupMember].forEach(obj => {
            groupList.push(obj + '.group');
        });
        copyTargetFiles(groupList, fromSrcFolder + groupFolder, targetSrcFolder + groupFolder);
        console.log('Groups were successfully copied.');
    }
    if (filesInPkg.hasOwnProperty(permissionSetMember)) {
        console.log('Start PermissionSets Copy');
        fs.mkdirsSync(targetSrcFolder + permissionSetFolder);
        var permissionSetList = Array();
        filesInPkg[permissionSetMember].forEach(ps => {
            permissionSetList.push(ps + '.permissionset');
        });
        copyTargetFiles(permissionSetList, fromSrcFolder + permissionSetFolder, targetSrcFolder + permissionSetFolder);
        console.log('PermissionSets were successfully copied.');
    }
}
function copyTargetFiles(files, fromFolder, toFolder) {
    files.forEach(targetFile => {
        try {
            fs.copyFileSync(fromFolder + targetFile, toFolder + targetFile);
        }
        catch (err) {
            console.log('Error happened when copying file from ' + fromFolder + targetFile + ' to ' + toFolder + targetFile);
            console.log('error : ', err);
        }
    });
}
function sortOutCustomFields(objectList, fieldsObject, targetFolder) {
    objectList.forEach(targetFile => {
        var xmlData = fs.readFileSync(targetFolder + targetFile);
        xml2js_1.parseString(xmlData, function (err, result) {
            var customFieldObj = {};
            if (err) {
                console.log('Error happened during parsing object xml. Error message : ' + err);
                return 8;
            }
            //get custom object tag
            customFieldObj['CustomObject'] = result.CustomObject;
            Object.keys(customFieldObj['CustomObject']).forEach(key => {
                if (!(key === 'fields' || key === '$'))
                    delete customFieldObj['CustomObject'][key];
            });
            var targetFieldList = Array();
            var allFieldList = result.CustomObject.fields;
            var fieldInPkgList = fieldsObject[targetFile.split('.')[0]];
            allFieldList.forEach(customField => {
                if (fieldInPkgList.includes(customField.fullName[0]))
                    targetFieldList.push(customField);
            });
            //get list of custom field
            customFieldObj['CustomObject']['fields'] = targetFieldList;
            const builder = new xml2js_1.Builder();
            //build xmlString
            var xmlStr = builder.buildObject(customFieldObj);
            //save xml file
            fs.writeFile(targetFolder + targetFile, xmlStr, function (err) {
                if (err)
                    console.log('Error happened when writing' + targetFile + ' Error Message : ' + err);
            });
        });
    });
}
const optionDefinitions = [
    {
        name: 'src',
        alias: 's',
        type: String,
        defaultValue: ''
    },
    {
        name: 'target',
        alias: 't',
        type: String,
        defaultValue: ''
    },
    {
        name: 'reuse',
        alias: 'r',
        type: Boolean,
        defaultValue: false
    }
];
const options = commandLineArgs(optionDefinitions);
const srcRoot = (options.src === '') ? options.src : options.src + '/';
const deployRoot = (options.target === '') ? options.target : options.target + '/';
if (!options.reuse)
    fs.removeSync(deployRoot + deployFolder);
if (!fs.existsSync(deployRoot + deployFolder))
    fs.mkdirsSync(deployRoot + deployFolder);
fs.copy(srcRoot + buildFolder, deployRoot + deployFolder + buildFolder, err => {
    if (err)
        return console.error(err);
    return console.log('build folder was successfully copied.');
});
fs.copy(srcRoot + srcFolder + packagexml, deployRoot + deployFolder + srcFolder + packagexml, err => {
    if (err)
        return console.error(err);
    return console.log('package.xml was successfully copied');
});
var filesInPkg = getTargetFiles(srcRoot, deployRoot);
copyTargetSrc(filesInPkg, srcRoot, deployRoot);
//# sourceMappingURL=DeployInit.js.map