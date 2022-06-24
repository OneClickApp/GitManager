define("GitManager0cb81961Section", ["GitManager0cb81961SectionResources"], function(resources) {
	return {
		entitySchemaName: "GitManager",
		details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "merge",
				"name": "SeparateModeAddRecordButton",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "DataGridActiveRowOpenAction",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "DataGridActiveRowCopyAction",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "DataGridActiveRowDeleteAction",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "DataGridActiveRowPrintAction",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "DataGridRunProcessAction",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "ProcessEntryPointGridRowButton",
				"values": {
					"visible": false
				}
			},
			{
				"operation": "merge",
				"name": "QuickFilterModuleContainer",
				"values": {
					"visible": false
				}
			}
		]/**SCHEMA_DIFF*/,
		attributes: {
			"SelectAllName": {
				dataValueType: Terrasoft.DataValueType.TEXT,
				value: "Выбрать все записи"
			},
		},
		methods: {
			settings: {},
			
			init: function(){
				this.callParent(arguments);
				this.readSettings();
				Terrasoft.ServerChannel.on(Terrasoft.EventName.ON_MESSAGE, this.serverLoggerListener, this);
			},
			
			serverLoggerListener: function(scope, message){
				if(message.Header && message.Header.Sender === "GitManager"){
					console.log("%c" + JSON.parse(message.Body), "background: #222; color: #bada55");
                }
			},
			
			getSectionActions: function() {
				var actionMenuItems = this.Ext.create("Terrasoft.BaseViewModelCollection");
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "reload"},
					"Caption": "Обновить",
					"Enabled": true,
					"IsEnabledForSelectedAll": true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "selectAllMode"},
					"Caption": { "bindTo": "SelectAllName"},
					"Enabled": true,
					"IsEnabledForSelectedAll": true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					Type: "Terrasoft.MenuSeparator",
					Visible: true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "uploadToFs"},
					"Caption": "Выгрузить пакеты в файловую систему",
					"Enabled": true,
					"IsEnabledForSelectedAll": true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					Type: "Terrasoft.MenuSeparator",
					Visible: true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "openSettings"},
					"Caption": "Настройки",
					"Enabled": true,
					"IsEnabledForSelectedAll": true
				}));
              
              	actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "clone"},
					"Caption": "Клонировать",
					"Enabled": { "bindTo": "isRepoSet" },
					"IsEnabledForSelectedAll": true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					Type: "Terrasoft.MenuSeparator",
					Visible: true
				}));
				
				//actionMenuItems.addItem(this.getButtonMenuItem({
				//	"Click": {"bindTo": "createBranch"},
				//	"Caption": "Создать ветку",
				//	"Enabled": true,
				//	"IsEnabledForSelectedAll": true
				//}));
				
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "updateFromGit"},
					"Caption": "Обновить из Git",
					"Enabled": true,
					"IsEnabledForSelectedAll": true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "commitAndPushSelected"},
					"Caption": "Зафиксировать выбранные",
					"Enabled": { "bindTo": "isAnySelected" },
					"IsEnabledForSelectedAll": true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					Type: "Terrasoft.MenuSeparator",
					Visible: true
				}));
				
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "revert"},
					"Caption": "Отменить изменения для выбранных",
					"Enabled": { "bindTo": "isAnySelected" },
					"IsEnabledForSelectedAll": true
				}));
              
              	var actionMenuSubItems = this.Ext.create("Terrasoft.BaseViewModelCollection");
              
				actionMenuItems.addItem(this.getButtonMenuItem({
					"Caption": "Дополнительные команды",
                  	"Items": actionMenuSubItems
				}));
              
				actionMenuSubItems.addItem(this.getButtonMenuItem({
					"Click": {"bindTo": "executeComand"},
                  	"Tag": "clean -f",
					"Caption": "clean",
					"Enabled": true,
					"IsEnabledForSelectedAll": true
				}));
              
              	//actionMenuSubItems.addItem(this.getButtonMenuItem({
				//	"Click": {"bindTo": "executeComandSelected"},
                //  	"Tag": "--",
				//	"Caption": "--",
				//	"Enabled": { "bindTo": "isAnySelected" },
				//	"IsEnabledForSelectedAll": true
				//}));
				
				return actionMenuItems;
			},
			
			updateFromGit: function(){
				this.showConfirmationDialog("Загрузить изменения из git?",
					function(result) {
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.showBodyMask();
							this.callService({
								serviceName: "GitHelperService",
								methodName: "UpdateFromGit",
								data: { items: this.getSelectedPaths() }
							}, function(res){
								this.hideBodyMask();
								if(res.UpdateFromGitResult !== "OK"){
									this.Terrasoft.utils.showInformation(res.UpdateFromGitResult);
								}
								else
								{
									this.updateFsAndCompile();
								}
								this.reloadGridData();
							}, this);
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
			
			uploadToFs: function(){
				this.showConfirmationDialog("Выгрузить пакеты в файловую систему?",
					function(result) {
						//ServiceModel/PackageService.svc/GetPackages
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.showBodyMask();
							Terrasoft.AjaxProvider.request({
								url: "/0/ServiceModel/AppInstallerService.svc/LoadPackagesToFileSystem",
								headers: {
									"Accept": "application/json",
									"Content-Type": "application/json"
								},
								method: "POST",
								jsonData: null,
								timeout: 300000,
								callback: function() {
									var success = arguments[1];
									var response = arguments[2];
									var responseObject = success ? Terrasoft.decode(response.responseText) : {};
									this.hideBodyMask();
									this.reloadGridData();
								}.bind(this)
							});
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
			
			updateFsAndCompile: function(){
				this.showConfirmationDialog("Обновить все пакеты и скомпилировать?",
					function(result) {
						//ServiceModel/PackageService.svc/GetPackages
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.showBodyMask();
							Terrasoft.AjaxProvider.request({
								url: "/0/ServiceModel/AppInstallerService.svc/LoadPackagesToDB",
								headers: {
									"Accept": "application/json",
									"Content-Type": "application/json"
								},
								method: "POST",
								timeout: 3000000,
								jsonData: null,
								callback: function() {
									var success = arguments[1];
									var response = arguments[2];
									var responseObject = success ? Terrasoft.decode(response.responseText) : {};
									this.hideBodyMask();
									this.compileAll();
								}.bind(this)
							});
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
			
			compileAll: function(){
				this.showBodyMask();
				Terrasoft.AjaxProvider.request({
					url: "/0/ServiceModel/WorkspaceExplorerService.svc/Build",
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json"
					},
					method: "POST",
					jsonData: null,
					timeout: 3000000,
					callback: function() {
						var success = arguments[1];
						var response = arguments[2];
						var responseObject = success ? Terrasoft.decode(response.responseText) : {};
						this.hideBodyMask();
						this.Terrasoft.utils.showInformation(responseObject.message);
					}.bind(this)
				});
			},
			
			revert: function(){
				this.showConfirmationDialog("Отменить изменения выбранных записей?",
					function(result) {
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.callService({
								serviceName: "GitHelperService",
								methodName: "GitRestore",
								data: { items: this.getSelectedPaths() }
							}, function(res){
								this.hideBodyMask();
								if(res.GitRestoreResult !== "OK"){
									this.Terrasoft.utils.showInformation(res.GitRestoreResult);
								}
								this.reloadGridData();
							}, this);
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
          
        	executeComand: function(command){
				this.showConfirmationDialog("Выполнить \"" + command + "\"?",
					function(result) {
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.callService({
								serviceName: "GitHelperService",
								methodName: "ExecuteCommand",
								data: { command: command }
							}, function(res){
								this.hideBodyMask();
								if(res.ExecuteCommandResult !== "OK"){
									this.Terrasoft.utils.showInformation(res.ExecuteCommandResult);
								}
								this.reloadGridData();
							}, this);
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
          
          	executeComandSelected: function(command){
				this.showConfirmationDialog("Выполнить \"" + command + "\" для выделенных записей?",
					function(result) {
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.callService({
								serviceName: "GitHelperService",
								methodName: "ExecuteItemsCommand",
								data: { command: command, items: this.getSelectedPaths() }
							}, function(res){
								this.hideBodyMask();
								if(res.ExecuteItemsCommandResult !== "OK"){
									this.Terrasoft.utils.showInformation(res.ExecuteItemsCommandResult);
								}
								this.reloadGridData();
							}, this);
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
			
			commitAndPush: function(result, args){
				if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
					if(!args.comment.value){
						this.Terrasoft.utils.showInformation("Комментарий не может быть пустым!");
						return;
					}
					
					if(!this.settings.setUnique && !args.branchName.value){
						this.Terrasoft.utils.showInformation("Название ветки не может быть пустым!");
						return;
					}
					
					this.showBodyMask();
					this.callService({
						serviceName: "GitHelperService",
						methodName: "CommitAndPushItems",
						data: { items: this.getSelectedPaths(), comment: args.comment.value, branchName: args.branchName.value }
					}, function(res){
						this.hideBodyMask();
                      	window.open(this.settings.repoUrl);
						if(res.CommitAndPushItemsResult !== "OK"){
							this.Terrasoft.utils.showInformation(res.CommitAndPushItemsResult);
						}
						this.reloadGridData();
					}, this);
				}
			},
			
			commitAndPushSelected: function(){
				Terrasoft.utils.inputBox(
					"Введите комментарий",
					this.commitAndPush,
					[
						{
							className: "Terrasoft.Button",
							caption: "Отправить",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Отмена",
							returnCode: "cancel"
						}
					],
					this,
					{
						comment: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Комментарий",
							isRequired: true
						},
						branchName: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Название ветки"
						}
						
					},
					{
						defaultButton: 0
					}
				);
			},
			
			reload: function(){
				this.reloadGridData();
			},
			
			readSettings: function(){
				this.callService({
					serviceName: "GitHelperService",
					methodName: "ReadSettings",
					data: { }
				}, function(res){
					this.settings = JSON.parse(res.ReadSettingsResult);
					
				}, this);
			},
          
          	isRepoSet: function(){
              	if(this.settings && this.settings.repoUrl){
              		return true;
                }
              	return false;
            },
          
          	clone: function(){
				this.showConfirmationDialog("Клонировать репозиторий \"" + this.settings.repoUrl + "\"?",
					function(result) {
						if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
							this.callService({
								serviceName: "GitHelperService",
								methodName: "GitClone",
								data: { }
							}, function(res){
								this.hideBodyMask();
								if(res.GitCloneResult !== "OK"){
									this.Terrasoft.utils.showInformation(res.GitCloneResult);
								}
								this.reloadGridData();
							}, this);
						}
					}, [{
							className: "Terrasoft.Button",
							caption: "Да",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Нет",
							returnCode: "cancel"
						}]
				);
			},
			
			saveSettings: function(result, args){
				if(result === Terrasoft.MessageBoxButtons.YES.returnCode){
					var password = this.settings.password;
					this.settings = {};
					this.settings.mainBranch = args.mainBranch.value;
					this.settings.branchPrefix = args.branchPrefix.value;
					this.settings.defaultPath = args.defaultPath.value;
					this.settings.setUnique = args.setUnique.value;
					this.settings.repoUrl = args.repoUrl.value;
					this.settings.login = args.login.value;
					this.settings.name = args.name.value;
					this.settings.email = args.email.value;
					if(args.password.value !== "******"){
						this.settings.password = args.password.value;
					}else{
						this.settings.password = password;
					}
					
					this.callService({
						serviceName: "GitHelperService",
						methodName: "SaveSettings",
						data: { settings: JSON.stringify(this.settings) }
					}, function(res){
						
					}, this);
				}
			},
			
			openSettings: function(){
				Terrasoft.utils.inputBox(
					"Настройки",
					this.saveSettings,
					[
						{
							className: "Terrasoft.Button",
							caption: "Ок",
							returnCode: "yes"
						},
						{
							className: "Terrasoft.Button",
							caption: "Отмена",
							returnCode: "cancel"
						}
					],
					this,
					{
						repoUrl: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Адрес репозитория",
							value: this.settings.repoUrl
						},
						mainBranch: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Основная ветка",
							value: this.settings.mainBranch
						},
						branchPrefix: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Префикс ветки",
							value: this.settings.branchPrefix
						},
						defaultPath: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Папка для синхронизации (Terrasoft.Configuration\\Pkg\\)",
							value: this.settings.defaultPath
						},
						setUnique: {
							dataValueType: Terrasoft.DataValueType.BOOLEAN,
							caption: "Добавлять уникальность к ветке",
							value: this.settings.setUnique
						},
						name: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Отображаемое имя",
							value: this.settings.name
						},
						email: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Email",
							value: this.settings.email
						},
						login: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Логин",
							value: this.settings.login
						},
						password: {
							dataValueType: Terrasoft.DataValueType.TEXT,
							caption: "Пароль",
							value: "******"
						},
					},
					{
						defaultButton: 0
					}
				);
			},
			
			selectAllMode: function(){
				if(this.getSelectedItems().length > 0){
					//this.unSetSelectAllMode();
					this.set("SelectedRows", []);
				}else{
					this.setSelectAllMode();
				}
				
				this.changeActionsButtonCaption();
			},
			
			onActiveRowChange: function() {
				this.callParent(arguments);
			},
			
			initCanLoadMoreData: function(){
				this.set("CanLoadMoreData", false);
			},
		
			addPrimaryColumnLink: function(item, column) {
				var scope = this;
				var columnPath = column.columnPath;
				this.addColumnLinkClickHandler(item, column, function() {
					var displayValue = item.get(columnPath);
					return {caption: displayValue, target: "_self", title: displayValue, url: "#"};
				});
			},
			
			createLink: function(entitySchemaName, columnPath, displayValue, recordId) {
				return {
					caption: displayValue,
					target: "_self",
					title: displayValue,
					url: "#"
				};
			},
			
			openCard: function(){
				this.linkClicked(this.get("ActiveRow"));
			},
			
			linkClicked: function(rowId, columnName) {
            	
			},
			
			changeActionsButtonCaption: function() {
				if(this.getSelectedItems().length > 0){
					this.set("SelectAllName", "Снять выделение");
				}else{
					this.set("SelectAllName", "Выбрать все записи");
				}
			},
			
			getSelectedPaths: function(){
				var itemsArr = [];
				this.$SelectedRows.forEach(function(item){
					//if(this.getGridData().collection.getByKey(item).get("Type") == "File"){
						itemsArr.push(this.getGridData().collection.getByKey(item).get("FullPath"));
					//}
				}, this);
				
				return itemsArr;
			},
			
			previousSelectedRows: [],
			
			onSelectedRowsChange: function() {
				if(this.$SelectedRows.length > this.previousSelectedRows.length && this.$SelectedRows.length > 0){
					var itemType = this.getGridData().collection.getByKey(this.$SelectedRows.at(-1)).get("Type");
					if(itemType == "Directory"){
						var hasItem = false;
						var rowKeys = [];
						var i = 0;
						this.getGridData().collection.items.forEach(function(item) {
							i++;
							if(hasItem && item.get("Type") == "File"){
								rowKeys.push(item.get("Id"));
							}
							if(hasItem && (item.get("Type") == "Directory" || this.getGridData().collection.length == i)){
								hasItem = false;
								var selectedRows = this.get("SelectedRows") || [];
								setTimeout(function(){
									this.set("SelectedRows", Ext.Array.merge(selectedRows, rowKeys));
								}.bind(this), 50);
							}
							if(item.get("Id") == this.$SelectedRows.at(-1)){
								hasItem = true;
							}
						}, this);
					}
				}
				this.previousSelectedRows = this.$SelectedRows;
			},

			loadGridData: function(){
				
				this.beforeLoadGridData();
				var esq = this.getGridDataESQ();
				this.initQueryColumns(esq);
				this.initQuerySorting(esq);
				this.initQueryFilters(esq);
				this.initQueryOptions(esq);
				this.initQueryEvents(esq);
				
				this.set("IsFile", false);
				this.set("IsDirectory", false);		
				this.set("IsRealItem", false);	
				this.set("IsZip", false);				
				
				this.callService({
					serviceName: "GitHelperService",
					methodName: "GetChangedItems",
					data: { }
				}, function(res){
				
					var rowConfig = { };
					
					var serviceResponse = JSON.parse(res.GetChangedItemsResult);
					var fileList = serviceResponse.Files;
					var currentBranch = serviceResponse.CurrentBranch; 
					
					this.set("CurrentBranch", currentBranch);
					
					this.sandbox.publish("ChangeHeaderCaption", {
						caption: "Git Manager (" + currentBranch + ")",
						markerValue: currentBranch,
						dataViews: new Terrasoft.Collection(),
						moduleName: currentBranch
					});
					
					if(fileList.length > 0){
						for(var colName in fileList[0]){
							var dataValueType = 1;
							if(colName === "Id"){
								dataValueType = 0;
							}
							rowConfig[colName] = {
								dataValueType:dataValueType, 
								columnPath: colName
							};
						}
					}
					
					var g = Ext.create("Terrasoft.BaseViewModelCollection", {
						entitySchema: "GitManager",
						rowConfig: rowConfig
					});
				
					Terrasoft.each(fileList, function(column, columnName) {
						var rowConfig = { };
						for(var colName in column) {
								var dataValueType = 1;
								if(colName === "Id"){
								dataValueType = 0;
							}
							rowConfig[colName] = {
								dataValueType:dataValueType, 
								columnPath: colName
							};
						}
							
						var item = Ext.create(esq.rowViewModelClassName, {
							entitySchema: this.entitySchema,
							rowConfig: rowConfig,
							values: column,
							isNew: !1,
							isDeleted: !1
						});
						
						g.add(item.get("Id"), item);
					}, this);
				
					var response = {
						success: true,
						collection: g,
						errorInfo: ""
					};
					
					this.destroyQueryEvents(esq);
					this.updateLoadedGridData(response, this.onGridDataLoaded, this);
					this.checkNotFoundColumns(response);
					
					this.setMultiSelect();
				}, this);
			}
		}
	};
});
