/*
 * util methods
 */
Utils = {
		
};
Utils.showLoading = function() {
	$("#loadingDiv").show();
}
Utils.hideLoading = function() {
	$("#loadingDiv").hide();
}
Utils.successMsg = function(message) {
	$('.successMsg').text(message);
	$('.successMsg').slideDown(function() {
		$('.successMsg').delay(3000).slideUp();
	});
}
Utils.moveToolTip = function(obj) {	
	var thumbNailImg = $($(obj).find("img")[0])
	$(thumbNailImg).css({ top: mousePos.getY() + 15, left: mousePos.getX() + 15});	
}
Utils.RenderTemplate=function(templateId , data,callBack){
	var template = $("#" + templateId).html();
	var compiledTemplate = Handlebars.compile(template);
	var widgetsDiv = $("#contentDiv");
	widgetsDiv.html(compiledTemplate(data));
	if(callBack) {
		callBack();
	}
};
var Handler = {
	ApiSpec: {
		/*getFiles : "googledrive.getfiles0",
		uploadFile: "googledrive.uploadfile0",
		getFileInfo: "googledrive.getfileinfo0"*/
		getFiles : "googledrive34.googledriverlwidget.getfiles",
		uploadFile: "googledrive34.googledriverlwidget.uploadfile",
		getfileInfo: "googledrive34.googledriverlwidget.getfileinfo"
	},
	MetaSpec: {
		// folderId : "DriveFolderID"
		folderId: "googledrive34.DriveFolderID",
		rootFolderId: "RootFolderID",
		connectorName: "googledrive34.googledriverlwidget"
	},
	Session: {
		
	}
}
Handler.widgetInit = function() {
	// Utils.showLoading();
	// ZOHO.CRM.CONNECTOR.authorize(Handler.MetaSpec.connectorName)
	// .then(function(){
	// 	Handler.refreshFileList();
	// })
	Utils.showLoading();
	Handler.refreshFileList();
};
Handler.getRecordId = function(data) {
	Handler.Session.pageData = data;
	console.log(data)
	// console.log(Handler.Session.pageData)
}
Handler.refreshFileList = function() {
	// console.log(Handler.Session.pageData)
	// ZOHO.CRM.INTERACTION.getPageInfo()

	setTimeout(function() {
		var entityval = Handler.Session.Entity;
		var entityIdVal = Handler.Session.EntityId;
		ZOHO.CRM.API.getRecord({ 'Entity': entityval, 'RecordID': entityIdVal })
		.then(function(response) {
			ZOHO.CRM.API.getRecord({ 'Entity': entityval, 'RecordID': entityIdVal })
			.then(Handler.getFolderInfo)
			.then(Handler.getFiles)
			.then(Handler.renderFileListNew)
			.then(function(data) {
				var templateData = {
					files: data
				}
				Utils.RenderTemplate("fileListing", templateData, Utils.hideLoading)
			})
		})
	}, 500)
		

	// ZOHO.CRM.API.getRecord({'Entity': Handler.Session.pageData.Entity, 'RecordID': Handler.Session.pageData.EntityId})
	// .then(function(response) {
	// 	if (response.status_code == 401) {
	// 		ZOHO.CRM.CONNECTOR.authorize(Handler.MetaSpec.connectorName)
	// 		.then(function(){
	// 			ZOHO.CRM.API.getRecord({'Entity': Handler.Session.pageData.Entity, 'RecordID': Handler.Session.pageData.EntityId})
	// 			.then(function(response) {
	// 				if (response.status_code == 401) {
	// 					ZOHO.CRM.CONNECTOR.authorize(Handler.MetaSpec.connectorName)
	// 					.then(function(){
	// 						Handler.refreshFileList();
	// 					})
	// 				}
	// 			})
	// 			.then(Handler.getFolderInfo)
	// 			.then(Handler.getFiles)
	// 			.then(Handler.renderFileListNew)
	// 			.then(function(data){
	// 				var templateData = {
	// 					files  : data
	// 				}
	// 				Utils.RenderTemplate("fileListing",templateData,Utils.hideLoading)
	// 			})
	// 		})
	// 	} else {
	// 		ZOHO.CRM.API.getRecord({'Entity': Handler.Session.pageData.Entity, 'RecordID': Handler.Session.pageData.EntityId})
	// 		.then(function(response) {
	// 			if (response.status_code == 401) {
	// 				ZOHO.CRM.CONNECTOR.authorize(Handler.MetaSpec.connectorName)
	// 				.then(function(){
	// 					Handler.refreshFileList();
	// 				})
	// 			}
	// 		})
	// 		.then(Handler.getFolderInfo)
	// 		.then(Handler.getFiles)
	// 		.then(Handler.renderFileListNew)
	// 		.then(function(data){
	// 			var templateData = {
	// 				files  : data
	// 			}
	// 			Utils.RenderTemplate("fileListing",templateData,Utils.hideLoading)
	// 		})
	// 	}
	// })


	// .then(Handler.getFolderInfo)
	// .then(Handler.getFiles)
	// .then(Handler.renderFileListNew)
	// .then(function(data){
	// 	var templateData = {
	// 		files  : data
	// 	}
	// 	Utils.RenderTemplate("fileListing",templateData,Utils.hideLoading)
	// })
}
Handler.getFolderInfo = function(pageInfo) {
	// console.log(pageInfo.data[0]);

	/*
	 * Check for folderID
	 */
	var folderId = pageInfo.data[0][Handler.MetaSpec.folderId]	
	
	Handler.Session.pageInfo = pageInfo;	
	/*
	 * CreateFolder if no folderID is present in the record
	 */
	if(!folderId) {
		var rootFolderId = pageInfo.data[0][Handler.MetaSpec.rootFolderId]
		Handler.Session.rootFolderId = rootFolderId;
		console.log('need to create folder');
		console.log(rootFolderId);
		console.log(Handler.Session.rootFolderId);
		return Handler.createFolder(pageInfo);
	} else {
		Handler.Session.folderId = folderId;
		return folderId;
	}
};
Handler.createFolder = function(response) {
	var module = response.entity;
	var rdata = response.data;
	
	var data = {
		"CONTENT_TYPE":"multipart",
		"PARTS":[
					{
						"headers": {  
							"Content-Type": "application/json"
						},
						"content": { "title": rdata.id,
									"mimeType": "application/vnd.google-apps.folder",
									"parents": [{ 'id': Handler.Session.rootFolderId }]
						}
					}
				]
	}
	return ZOHO.CRM.CONNECTOR.invokeAPI(Handler.ApiSpec.uploadFile, data)			
	.then(function(response) {
		var temp = response;
		var googleDriveResp = JSON.parse(temp.response);
		var folderId = googleDriveResp.id;
		Handler.Session.folderId = folderId;
		return folderId;
	}).then(function(folderId) {		
		var updateData = {
		    "id": rdata.id,
		};
		updateData[Handler.MetaSpec.folderId] = folderId
		var config= {
			Entity: module,
			APIData: updateData
		}
		return ZOHO.CRM.API.updateRecord(config).then(function(data) {
			if (data && data instanceof Array && data[0].code === "SUCCESS") {
				return folderId;
			} else {
				console.log('create folder -> undefined')
				return undefined;
			}
		})
	})
};
Handler.getFiles = function(folderId) {
	return ZOHO.CRM.CONNECTOR.invokeAPI(Handler.ApiSpec.getFiles, {folderId: folderId} )
	.then(function(gDriveResp) {
		var resp = JSON.parse(gDriveResp.response)
		var files = resp.items;
		return files;
	})
};
Handler.renderFileListNew = function(files) {
	var allFiles = [];
	var pRes;
	return Handler.getFileInfo(files)
	.then(function(data) {
		return data;
	});
}
Handler.getFileInfo = function(files, allFiles, callBack) {	
	var promises=[];
	for (file in files) {
		var filePromise = ZOHO.CRM.CONNECTOR.invokeAPI(Handler.ApiSpec.getfileInfo, {fileID: files[file].id}).then(function(data) {
			return JSON.parse(data.response)
		});
		promises.push(filePromise); 
	}
	return Promise.all(promises);
}
Handler.uploadFile = function() {	
	Utils.showLoading();
	// var file = $("#gdrive-file")
	var fileuploaded = document.getElementById("gdrive-file").files[0];
	console.log('starting logging file:');
	console.log(document.getElementById("gdrive-file").files[0]);
	console.log(fileuploaded.type);
	console.log(fileuploaded.name);
	console.log(Handler.Session.folderId);
	var fileType;
	// if (file.type === "application/pdf"){
	// 	fileType = file.type;
	// }
	// else if(file.type === "image/jpeg"){
	// 	fileType = file.type;
	// }
	// else if(file.type === "text/plain"){
	// 	fileType = "application/msword";
	// }
	// else if(file.type === ""){
	// 	fileType = "application/msword";
	// } else {
	// 	fileType = file.type;
	// }
	if (fileuploaded.type == "") {
		fileType = "application/msword";
	} else {
		fileType = fileuploaded.type;
	}
	var data = {
		"VARIABLES": {
			"pathFileName": "/" + fileuploaded.name
		},
		// "CONTENT_TYPE":"multipart",
		// "CONTENT_LENGTH": fileuploaded.size,
		// "CONTENT_TYPE": "multipart/related; boundary=foo_bar_baz",
		"Content-Type": "multipart/related; boundary=foo_bar_baz",
		"Content-Length": fileuploaded.size,
		// "Content-Length": fileuploaded.size,
		"PARTS": [
			{
				"headers": {  
					"Content-Type": "application/json; charset=UTF-8"
					// "Content-Type": "application/json"
				},
				"content": { 
					"mimeType": fileType,
					"description": "Uploaded by Zoho CRM (Google Drive Integration)",
					"title": fileuploaded.name
					// "parents": [{'id': Handler.Session.folderId}]
				}
			},
			{
				"headers": {
					// "Content-Disposition": "file;"
					"Content-Disposition": "attachment; filename=" + fileuploaded.name
				},
				"content": "__FILE__"
			}
		],
		"FILE": {
			"fileParam": "content",
			"file": fileuploaded
		}
	}
	console.log(data);
	ZOHO.CRM.CONNECTOR.invokeAPI(Handler.ApiSpec.uploadFile,data)
	.then(function(response) {
		console.log(response);
		Handler.refreshFileList();
	})
}