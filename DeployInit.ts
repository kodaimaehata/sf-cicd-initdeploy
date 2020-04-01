import * as fs from 'fs-extra';
import {parseString, Builder} from 'xml2js';

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
const cachePartitionFolder = 'cachePartitions/';
const reportTypeFolder = 'reportTypes/';
const customLabelFolder = 'labels/';

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
const cachePartitionMember = 'PlatformCachePartition';
const reportTypeMember = 'ReportType';
const customLabelMember = 'CustomLabel';

function getTargetFiles(srcRoot : string,deployRoot : string ) : any{

    fs.mkdirsSync(deployRoot + deployFolder + srcFolder);

    var xmlData = fs.readFileSync(srcRoot + srcFolder + packagexml);

    var filesInPkg : Object = {};

	parseString(xmlData, function(err,result){

		if(err){
			console.log('Error happened during parsing package.xml. Error message is : ' + err);
			return;
        }
        
		var types : Array<any> = result.Package.types;

        if(types){
			var targetTypes : Array<any> = types.filter(t => {return t.name[0] === classMember || t.name[0] === componentMember || t.name[0] === pagesMember || t.name[0] === objectMember || t.name[0] === customFieldMember || t.name[0] === staticResourceMember || t.name[0] === pageLayoutMember || t.name[0] === flexiPageMember || t.name[0] === triggerMember || t.name[0] === reportMember || t.name[0] === groupMember || t.name[0] === permissionSetMember || t.name[0] === cachePartitionMember || t.name[0] === reportTypeMember || t.name[0] === customLabelMember;});
			targetTypes.forEach( t => {
                // filesInPkg[t.name[0]] = t.members.toString().split(".")[0];
                filesInPkg[t.name[0]] = t.members;
            });	
        }
        
	});

    return filesInPkg;

}

function copyTargetSrc(filesInPkg : Object,srcRoot : string, deployRoot : string){
    var fromSrcFolder : string = srcRoot + srcFolder;
    var targetSrcFolder : string = deployRoot + deployFolder + srcFolder;

    if(filesInPkg.hasOwnProperty(objectMember)){
        console.log('Start Object Copy');
        fs.mkdirsSync(targetSrcFolder + objectsFolder);

        var objectList : Array<string> = Array<string>();

        filesInPkg[objectMember].forEach(obj => {
            objectList.push(obj + '.object');
        });

        copyTargetFiles(objectList,fromSrcFolder + objectsFolder, targetSrcFolder + objectsFolder);
        console.log('Objects were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(customFieldMember)){
        console.log('Start Object for Custom Field Copy');
        if(!fs.existsSync(targetSrcFolder + objectsFolder)) fs.mkdirsSync(targetSrcFolder + objectsFolder);

        var objectList : Array<string> = Array<string>();

        var fieldsObject : Object = {};

        filesInPkg[customFieldMember].forEach(field => {
            var objectName = field.split('.')[0];
            var fieldName = field.split('.')[1];

            objectList.push(objectName + '.object');
            if(!fieldsObject.hasOwnProperty(objectName)) fieldsObject[objectName] = Array<string>();
            fieldsObject[objectName].push(fieldName);
        });

        objectList = Array.from(new Set(objectList));

        copyTargetFiles(objectList,fromSrcFolder + objectsFolder, targetSrcFolder + objectsFolder);
        sortOutCustomFields(objectList,fieldsObject, targetSrcFolder + objectsFolder );

        console.log('Objects were successfully copied');
    }

    if(filesInPkg.hasOwnProperty(classMember)){
        console.log('Start Class Copy');
        fs.mkdirsSync(targetSrcFolder + classesFolder);

        var classList : Array<string> = new Array<string>();
        filesInPkg[classMember].forEach( cls  => {
            classList.push(cls + '.cls');
            classList.push(cls + '.cls-meta.xml');
        })       

        copyTargetFiles(classList,fromSrcFolder + classesFolder, targetSrcFolder + classesFolder);
        console.log('Classes were successfully copied.');
    }

    if(filesInPkg.hasOwnProperty(componentMember)){
        console.log('Start Component Copy');
        fs.mkdirsSync(targetSrcFolder + componentsFolder);

        var componentList : Array<string> = new Array<string>();
        filesInPkg[componentMember].forEach(cmp => {
            componentList.push(cmp + '.component');
            componentList.push(cmp + '.component-meta.xml');
        });

        copyTargetFiles(componentList,fromSrcFolder + componentsFolder, targetSrcFolder + componentsFolder);
        console.log('Components were successfully copied.');
    }

    if(filesInPkg.hasOwnProperty(pagesMember)){
        console.log('Start Page Copy');
        fs.mkdirsSync(targetSrcFolder + pagesFolder);

        var pageList : Array<string> = new Array<string>();

        filesInPkg[pagesMember].forEach(pg => {
            pageList.push(pg + '.page');
            pageList.push(pg + '.page-meta.xml');            
        });

        copyTargetFiles(pageList,fromSrcFolder + pagesFolder, targetSrcFolder + pagesFolder);
        console.log('Pages were successfully copied.');
    }

    if(filesInPkg.hasOwnProperty(staticResourceMember)){
        console.log('Start Static Resource Copy');
        fs.mkdirsSync(targetSrcFolder + staticResoueceFolder);

        var fileList : Array<string> = fs.readdirSync(fromSrcFolder + staticResoueceFolder);
        var itemList : Array<string> = filesInPkg[staticResourceMember];

        var staticResourceList : Array<string> = new Array<string>();

        fileList.forEach(file => {
            if(itemList.includes(file.split('.')[0])) staticResourceList.push(file); 
        })

        copyTargetFiles(staticResourceList, fromSrcFolder + staticResoueceFolder, targetSrcFolder + staticResoueceFolder);
        console.log('Static Resources were successfully copied');
    }

    if(filesInPkg.hasOwnProperty(pageLayoutMember)){
        console.log('Start PageLayouts Copy');
        fs.mkdirsSync(targetSrcFolder + pageLayoutFolder);

        var pageLayoutList : Array<string> = Array<string>();

        filesInPkg[pageLayoutMember].forEach(pl => {
            pageLayoutList.push(pl + '.layout');
        });

        copyTargetFiles(pageLayoutList,fromSrcFolder + pageLayoutFolder, targetSrcFolder + pageLayoutFolder);
        console.log('PageLayouts were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(flexiPageMember)){
        console.log('Start FlexiPages Copy');
        fs.mkdirsSync(targetSrcFolder + flexiPageFolder);

        var flexiPageList : Array<string> = Array<string>();

        filesInPkg[flexiPageMember].forEach(fp => {
            flexiPageList.push(fp + '.flexipage');
        });

        copyTargetFiles(flexiPageList,fromSrcFolder + flexiPageFolder, targetSrcFolder + flexiPageFolder);
        console.log('FlexiPages were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(triggerMember)){
        console.log('Start Triggers Copy');
        fs.mkdirsSync(targetSrcFolder + triggerFolder);

        var triggerList : Array<string> = Array<string>();

        filesInPkg[triggerMember].forEach(fp => {
            triggerList.push(fp + '.trigger');
            triggerList.push(fp + '.trigger-meta.xml');
        });

        copyTargetFiles(triggerList,fromSrcFolder + triggerFolder, targetSrcFolder + triggerFolder);
        console.log('Triggers were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(reportMember)){
        console.log('Start Folders/Reports Copy');
        fs.mkdirsSync(targetSrcFolder + reportRootFolder);

        var folderSet : Set<string> = new Set<string>();
        var folderMetaList : Array<string> = new Array<string>();
        var reoprtList : Array<string> = new Array<string>();
        

        filesInPkg[reportMember].forEach(fp => {
            let elementList : Array<string> = fp.split('/');

            if(elementList.length === 2){
                folderSet.add(elementList[0]);
                reoprtList.push(fp + '.report');
            }else if(elementList.length === 1){
                folderMetaList.push(fp + '-meta.xml');
            }
        });

        folderSet.forEach(folder => {
            fs.mkdirsSync(targetSrcFolder + reportRootFolder + '/' + folder);
        });

        copyTargetFiles(folderMetaList,fromSrcFolder + reportRootFolder, targetSrcFolder + reportRootFolder);
        copyTargetFiles(reoprtList,fromSrcFolder + reportRootFolder, targetSrcFolder + reportRootFolder);
        console.log('Folders/Reports were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(groupMember)){
        console.log('Start Groups Copy');
        fs.mkdirsSync(targetSrcFolder + groupFolder);

        var groupList : Array<string> = Array<string>();

        filesInPkg[groupMember].forEach(obj => {
            groupList.push(obj + '.group');
        });

        copyTargetFiles(groupList,fromSrcFolder + groupFolder, targetSrcFolder + groupFolder);
        console.log('Groups were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(permissionSetMember)){
        console.log('Start PermissionSets Copy');
        fs.mkdirsSync(targetSrcFolder + permissionSetFolder);

        var permissionSetList : Array<string> = Array<string>();

        filesInPkg[permissionSetMember].forEach(ps => {
            permissionSetList.push(ps + '.permissionset');
        });

        copyTargetFiles(permissionSetList,fromSrcFolder + permissionSetFolder, targetSrcFolder + permissionSetFolder);
        console.log('PermissionSets were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(cachePartitionMember)){
        console.log('Start CachePartitions Copy');
        fs.mkdirsSync(targetSrcFolder + cachePartitionFolder);

        var cachePartitionList : Array<string> = Array<string>();

        filesInPkg[cachePartitionMember].forEach(cp => {
            cachePartitionList.push(cp + '.cachePartition');
        });

        copyTargetFiles(cachePartitionList,fromSrcFolder + cachePartitionFolder, targetSrcFolder + cachePartitionFolder);
        console.log('CachePartitions were successfully copied.');

    }
    
    if(filesInPkg.hasOwnProperty(reportTypeMember)){
        console.log('Start ReportTypes Copy');
        fs.mkdirsSync(targetSrcFolder + reportTypeFolder);

        var reportTypeList : Array<string> = Array<string>();

        filesInPkg[reportTypeMember].forEach(rt => {
            reportTypeList.push(rt + '.reportType');
        });

        copyTargetFiles(reportTypeList,fromSrcFolder + reportTypeFolder, targetSrcFolder + reportTypeFolder);
        console.log('ReportTypes were successfully copied.');

    }

    if(filesInPkg.hasOwnProperty(customLabelMember)){
        console.log('Start CustomLabel Copy');
        if(!fs.existsSync(targetSrcFolder + customLabelFolder)) fs.mkdirsSync(targetSrcFolder + customLabelFolder);

        var customLabelList : Array<string> = Array<string>();
        customLabelList.push('CustomLabels.labels');
    
        var labelsObject : Object = {};
        labelsObject['CustomLabels'] = Array<string>();

        filesInPkg[customLabelMember].forEach(label => {
            labelsObject['CustomLabels'].push(label);
        });


        copyTargetFiles(customLabelList,fromSrcFolder + customLabelFolder, targetSrcFolder + customLabelFolder);
        sortOutCustomLabels(customLabelList,labelsObject, targetSrcFolder + customLabelFolder );

        console.log('CustomLabels were successfully copied');
    }

}

function copyTargetFiles(files : Array<string>, fromFolder : string , toFolder : string){

    files.forEach(targetFile => {
        try{
            fs.copyFileSync(fromFolder + targetFile, toFolder + targetFile);
        }catch(err){
            console.log('Error happened when copying file from ' +fromFolder + targetFile + ' to ' +  toFolder + targetFile);
            console.log('error : ', err);
            process.exit(8);
        }
    });

}

function sortOutCustomFields(objectList : Array<string>, fieldsObject : Object,targetFolder : string){

    sortOutFields(objectList,fieldsObject,targetFolder,'CustomObject','fields');

}

function sortOutCustomLabels(customLabelList : Array<string>, labelsObject : Object,targetFolder : string){

    sortOutFields(customLabelList,labelsObject,targetFolder,'CustomLabels','labels');

}

function sortOutFields(fileList : Array<string>, fieldsObject : Object,targetFolder : string,targetParentKey : string , targetChildKey : string){

    fileList.forEach(targetFile => {
        var xmlData = fs.readFileSync(targetFolder + targetFile);

        parseString(xmlData, function(err,result){
            var fieldsObj :Object = {};

            if(err){
                console.log('Error happened during parsing object xml. Error message : ' + err);
                return 8;
            } 
            //get custom object tag
            fieldsObj[targetParentKey] = result[targetParentKey];
            Object.keys(fieldsObj[targetParentKey]).forEach(key =>{
                if(!(key === targetChildKey || key==='$')) delete fieldsObj[targetParentKey][key];
            })

            var targetFieldList : Array<any> = Array<any>();

            var allFieldList = result[targetParentKey][targetChildKey];

            var fieldInPkgList = fieldsObject[targetFile.split('.')[0]];
            
            allFieldList.forEach(field  =>{
                if(fieldInPkgList.includes(field.fullName[0])) targetFieldList.push(field);
            })

            //get list of custom field
            fieldsObj[targetParentKey][targetChildKey] = targetFieldList;

            const builder = new Builder();

            //build xmlString
            var xmlStr = builder.buildObject(fieldsObj);
        
            //save xml file
            fs.writeFile(targetFolder + targetFile,xmlStr,function(err){
                if(err) console.log('Error happened when writing' + targetFile + ' Error Message : ' + err);
            });

        })
    })

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
        alias:  'r',
        type: Boolean,
        defaultValue: false
    }
];

const options = commandLineArgs(optionDefinitions);

const srcRoot : string = (options.src === '') ? options.src : options.src + '/';
const deployRoot : string = (options.target === '')? options.target : options.target + '/';

if(!options.reuse) fs.removeSync(deployRoot + deployFolder);

if(!fs.existsSync(deployRoot + deployFolder)) fs.mkdirsSync(deployRoot + deployFolder);

fs.copy(srcRoot + buildFolder ,deployRoot + deployFolder + buildFolder, err => {
    if(err) return console.error(err);
    return console.log('build folder was successfully copied.')
});
fs.copy(srcRoot + srcFolder + packagexml , deployRoot + deployFolder + srcFolder + packagexml , err => {
    if(err) return console.error(err);
    return console.log('package.xml was successfully copied');
});

var filesInPkg : Object = getTargetFiles(srcRoot , deployRoot);
copyTargetSrc(filesInPkg, srcRoot,deployRoot);
