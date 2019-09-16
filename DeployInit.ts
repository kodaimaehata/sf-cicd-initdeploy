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

const classMember = 'ApexClass';
const componentMember = 'ApexComponent';
const pagesMember = 'ApexPage';
const objectMember = 'CustomObject';
const customFieldMember = 'CustomField';
const staticResourceMember = 'StaticResource';

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
			var targetTypes : Array<any> = types.filter(t => {return t.name[0] === classMember || t.name[0] === componentMember || t.name[0] === pagesMember || t.name[0] === objectMember || t.name[0] === customFieldMember || t.name[0] === staticResourceMember;});
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
        console.log('Classes were successfully copied.');

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

}

function copyTargetFiles(files : Array<string>, fromFolder : string , toFolder : string){

    files.forEach(targetFile => {
        try{
            fs.copyFileSync(fromFolder + targetFile, toFolder + targetFile);
        }catch(err){
            console.log('Error happened when copying file from ' +fromFolder + targetFile + ' to ' +  toFolder + targetFile);
        }
    });

}

function sortOutCustomFields(objectList : Array<string>, fieldsObject : Object,targetFolder : string){

    objectList.forEach(targetFile => {
        var xmlData = fs.readFileSync(targetFolder + targetFile);

        parseString(xmlData, function(err,result){
            var customFieldObj :Object = {};

            if(err){
                console.log('Error happened during parsing object xml. Error message : ' + err);
                return 8;
            } 
            //get custom object tag
            customFieldObj['CustomObject'] = result.CustomObject;
            Object.keys(customFieldObj['CustomObject']).forEach(key =>{
                if(!(key === 'fields' || key==='$')) delete customFieldObj['CustomObject'][key];
            })

            var targetFieldList : Array<any> = Array<any>();

            var allFieldList = result.CustomObject.fields;

            var fieldInPkgList = fieldsObject[targetFile.split('.')[0]];
            
            allFieldList.forEach(customField  =>{
                if(fieldInPkgList.includes(customField.fullName[0])) targetFieldList.push(customField);
            })

            //get list of custom field
            customFieldObj['CustomObject']['fields'] = targetFieldList;

            const builder = new Builder();

            //build xmlString
            var xmlStr = builder.buildObject(customFieldObj);
        
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
        name: 'clean',
        alias:  'c',
        type: Boolean,
        defaultValue: true
    }
];

const options = commandLineArgs(optionDefinitions);

const srcRoot : string = (options.src === '') ? options.src : options.src + '/';
const deployRoot : string = (options.target === '')? options.target : options.target + '/';

if(options.clean) fs.removeSync(deployRoot + deployFolder);

if(!fs.existsSync(deployRoot + deployFolder)) fs.mkdirsSync(deployRoot + deployFolder);

fs.copy(srcRoot + buildFolder ,deployRoot + deployFolder + buildFolder, err => {
    if(err) return console.error(err);
    return console.log('build folder was successfully copied.')
});
fs.copy(srcRoot + srcFolder + packagexml , deployRoot + deployFolder + srcFolder + packagexml , err => {
    if(err) return console.error(err);
    return console.log('package.xml was successfully copied');
});

var filesInPkg = getTargetFiles(srcRoot , deployRoot);
copyTargetSrc(filesInPkg, srcRoot,deployRoot);
