define("SystemDesigner", ["SystemDesignerResources"],
	function(resources) {
	return {
		attributes: {},
		methods: {
			onGitManagerLinkClick: function() {
              	this.sandbox.publish("PushHistoryState", {hash: "SectionModuleV2/GitManager0cb81961Section/"});
				return false;
			}
		},
		diff: [
			{
				"operation": "insert",
				"propertyName": "items",
				"parentName": "ConfigurationTile",
				"name": "GitManagerLink",
				"values": {
					"itemType": Terrasoft.ViewItemType.LINK,
					"caption": {"bindTo": "Resources.Strings.GitManagerLinkCaption"},
					"click": {"bindTo": "onGitManagerLinkClick"}
				}
			}
		]
	};
});