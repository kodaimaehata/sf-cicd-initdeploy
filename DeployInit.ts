import * as fs from 'fs-extra';
import {parseString, Builder} from 'xml2js';

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

function getTargetFiles() : any{

    fs.mkdirsSync(deployRoot + srcFolder);

    var xmlData = fs.readFileSync(srcFolder + packagexml);

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

function copyTargetSrc(filesInPkg : Object){

    if(filesInPkg.hasOwnProperty(objectMember) || filesInPkg.hasOwnProperty(customFieldMember)){
        console.log('Start Object Copy');
        fs.mkdirsSync(deployRoot + srcFolder + objectsFolder);

        var objectList : Array<string> = Array<string>();
        filesInPkg[objectMember].forEach(obj => {
            objectList.push(obj + '.object');
        });
        console.debug(filesInPkg[customFieldMember]);

        filesInPkg[customFieldMember].forEach(field => {
            objectList.push(field.split('.')[0] + '.object');
        });
        console.debug(objectList);

        var objectList = Array.from(new Set(objectList));
        console.debug(objectList);

        copyTargetFiles(objectList,srcFolder + objectsFolder, deployRoot + srcFolder + objectsFolder);
        console.log('Objects were successfully copied');
    }

    if(filesInPkg.hasOwnProperty(classMember)){
        console.log('Start Class Copy');
        fs.mkdirsSync(deployRoot + srcFolder + classesFolder);

        var classList : Array<string> = new Array<string>();
        filesInPkg[classMember].forEach( cls  => {
            classList.push(cls + '.cls');
            classList.push(cls + '.cls-meta.xml');
        })       

        copyTargetFiles(classList,srcFolder + classesFolder, deployRoot + srcFolder + classesFolder);
        console.log('Classes were successfully copied.');
    }

    if(filesInPkg.hasOwnProperty(componentMember)){
        console.log('Start Component Copy');
        fs.mkdirsSync(deployRoot + srcFolder + componentsFolder);

        var componentList : Array<string> = new Array<string>();
        filesInPkg[componentMember].forEach(cmp => {
            componentList.push(cmp + '.component');
            componentList.push(cmp + '.component-meta.xml');
        });

        copyTargetFiles(componentList,srcFolder + componentsFolder, deployRoot + srcFolder + componentsFolder);
        console.log('Components were successfully copied.');
    }

    if(filesInPkg.hasOwnProperty(pagesMember)){
        console.log('Start Page Copy');
        fs.mkdirsSync(deployRoot + srcFolder + pagesFolder);

        var pageList : Array<string> = new Array<string>();

        filesInPkg[pagesMember].forEach(pg => {
            pageList.push(pg + '.page');
            pageList.push(pg + '.page-meta.xml');            
        });

        copyTargetFiles(pageList,srcFolder + pagesFolder, deployRoot + srcFolder + pagesFolder);
        console.log('Pages were successfully copied.');
    }

    if(filesInPkg.hasOwnProperty(staticResourceMember)){
        console.log('Start Static Resource Copy');
        fs.mkdirsSync(deployRoot + srcFolder + staticResoueceFolder);

        var fileList : Array<string> = fs.readdirSync(srcFolder + staticResoueceFolder);
        var itemList : Array<string> = filesInPkg[staticResourceMember];

        var staticResourceList : Array<string> = new Array<string>();

        fileList.forEach(file => {
            if(itemList.includes(file.split('.')[0])) staticResourceList.push(file); 
        })

        copyTargetFiles(staticResourceList, srcFolder + staticResoueceFolder, deployRoot + srcFolder + staticResoueceFolder);
        console.log('Static Resources were successfully copied');
    }

}

function copyTargetFiles(files : Array<string>, fromFolder : string , toFolder : string){
    // console.log('toFolder is ' + toFolder);

    // console.log('contents in files : ' + files);

    files.forEach(targetFile => {

        fs.copyFile(fromFolder + targetFile, toFolder + targetFile , (err) => {
            if(err){
                console.log('File Copy error.' + err);
            }
        })
    });

}

fs.removeSync(deployRoot);

fs.mkdirsSync(deployRoot);

fs.copy(buildFolder ,deployRoot + buildFolder, err => {
    if(err) return console.error(err);
    return console.log('build folder was successfully copied.')
});
fs.copy(srcFolder + packagexml , deployRoot + srcFolder + packagexml , err => {
    if(err) return console.error(err);
    return console.log('package.xml was successfully copied');
});

var filesInPkg = getTargetFiles();
copyTargetSrc(filesInPkg);
