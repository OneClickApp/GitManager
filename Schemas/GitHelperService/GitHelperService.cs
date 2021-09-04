namespace Terrasoft.Configuration
{
	using System;
	using System.Collections.Generic;
	using System.Linq;
	using System.Text;
	using System.Web;
	using System.ServiceModel;
	using System.ServiceModel.Web;
	using System.ServiceModel.Activation;
	using System.IO;
	using Newtonsoft.Json;
	using Newtonsoft.Json.Converters;
	using Terrasoft.Core;
	using Terrasoft.Core.Entities;

	[ServiceContract]
	[AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
	public class GitHelperService
	{
		private UserConnection userConnection = null;
		public UserConnection UserConnection
		{
			get
			{
				if (this.userConnection == null)
				{
					this.userConnection = (UserConnection)HttpContext.Current.Session[@"UserConnection"];
				}

				return this.userConnection;
			}
		}

		public class Response
		{
			public List<GitFileInfo> Files { get; set; }
			public string CurrentBranch { get; set; }
		}

		public class GitFileInfo
		{
			public Guid Id { get; set; }
			public string Name { get; set; }
			public string FullPath { get; set; }
			public string Type { get; set; }
		}

		private string WorkingDirectory
		{
			get
			{
				var settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(ReadSettings());
				if (settings.ContainsKey("defaultPath"))
				{
					return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Terrasoft.Configuration\\Pkg", settings["defaultPath"].ToString());
				}
				else
				{
					return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Terrasoft.Configuration\\Pkg");
				}
			}
		}

		private string BranchPrefix
		{
			get
			{
				var settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(ReadSettings());
				if (settings.ContainsKey("branchPrefix"))
				{
					return settings["branchPrefix"].ToString();
				}
				else
				{
					return "CRM_";
				}
			}
		}

		private string BranchPostfix
		{
			get
			{
				var settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(ReadSettings());
				if (settings.ContainsKey("setUnique") && settings["setUnique"].ToString() == "True")
				{
					return DateTime.Now.ToString("yyMMdd") + Convert.ToInt32((DateTime.Now - DateTime.Now.Date).TotalSeconds).ToString();
				}
				else 
				{
					return "";
				}
			}
		}

		private string MainBranch
		{
			get
			{
				var settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(ReadSettings());
				if (settings.ContainsKey("mainBranch"))
				{
					return settings["mainBranch"].ToString();
				}
				else
				{
					return "dev";
				}
			}
		}

		private string RepoUrl
		{
			get
			{
				try
				{
					var settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(ReadSettings());
					if (settings.ContainsKey("repoUrl") && settings.ContainsKey("login") && settings.ContainsKey("password"))
					{
						var login = settings["login"].ToString();
						var password = settings["password"].ToString();
						var repoUrl = settings["repoUrl"].ToString();
						Uri url = new Uri(settings["repoUrl"].ToString());
						string scheme = url.GetLeftPart(UriPartial.Scheme);
						repoUrl = repoUrl.Replace(scheme, "");
						repoUrl = $"http://{login}:{password}@{repoUrl}";
						return repoUrl;
					}
					else
					{
						return "";
					}
				}
				catch
				{
					return "";
				}
			}
		}

		//Convert.ToInt32((DateTime.Now - DateTime.Now.Date).TotalSeconds).ToString();

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string GitGetCurrentBranch()
		{
			var git = new GitHelper(WorkingDirectory);
			return git.GitGetCurrentBranch().Result;
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string UpdateFromGit()
		{
			var git = new GitHelper(WorkingDirectory);
			var checkout = git.GitCheckout(MainBranch);
			if (!checkout.Success)
			{
				return "checkout error: " + checkout.ErrorDescription + "\r\n" + checkout.Result;
			}

			var pull = git.GitPull(MainBranch);
			if (!pull.Success)
			{
				return "pull error: " + pull.ErrorDescription + "\r\n" + pull.Result;
			}

			//var branch = git.GitBranch(NewBranchName);
			//if (!branch.Success)
			//{
			//	return "branch error: " + branch.ErrorDescription + "\r\n" + branch.Result;
			//}
			return "OK";
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string GitRestore(List<string> items)
		{
			var git = new GitHelper(WorkingDirectory);
			var changedItems = git.GetChangedItems();

			var itemsToRestore = new List<GitHelper.GitItem>();

			foreach (var item in items)
			{
				var itemToRestore = changedItems.FirstOrDefault(el => el.FullPath == item);
				if (itemToRestore != null)
				{
					itemsToRestore.Add(itemToRestore);
				}
			}
			if (itemsToRestore.Count > 0)
			{
				git.GitRestore(itemsToRestore);
				return "OK";
			}

			return "no items to restore!";
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string GitBranch(string name)
		{
			var git = new GitHelper(WorkingDirectory);
			return git.GitBranch(name).Result;
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string GitCheckout(string branchName)
		{
			var git = new GitHelper(WorkingDirectory);
			return git.GitCheckout(branchName).Result;
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string GitCommit(string comment)
		{
			var git = new GitHelper(WorkingDirectory);
			return git.GitCommit(comment).Result;
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string AddItemsToCommit(List<string> items)
		{
			return null;
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string CommitAndPushItems(List<string> items, string comment, string branchName)
		{
			var git = new GitHelper(WorkingDirectory);
			if (RepoUrl != "")
			{
				git.GitRemoteAdd(RepoUrl);
			}

			var branch = git.GitBranch(BranchPrefix + branchName + BranchPostfix);
			if (!branch.Success)
			{
				return "branch error: " + branch.ErrorDescription + "\r\n" + branch.Result;
			}

			var gitItems = new List<GitHelper.GitItem>();

			foreach (var item in items)
			{
				gitItems.Add(new GitHelper.GitItem() {
					FullPath = item
				});
			}

			var addItemsToCommitResult = git.AddItemsToCommit(gitItems);
			if (!addItemsToCommitResult.Success)
			{
				return addItemsToCommitResult.ErrorDescription;
			}
			var gitCommitResult = git.GitCommit(comment);
			if (!gitCommitResult.Success)
			{
				return gitCommitResult.ErrorDescription;
			}
			var gitPushResult = git.GitPush();
			if (!gitPushResult.Success)
			{
				return gitPushResult.ErrorDescription;
			}

			return "branch.Result: " + branch.Result + "\r\naddItemsToCommitResult.Result: " + addItemsToCommitResult.Result + "\r\ngitCommitResult.Result: " + gitCommitResult.Result + "\r\ngitPushResult.Result: " + gitPushResult.Result + "\r\n";
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string SaveSettings(string settings)
		{
			var sysUserId = UserConnection.CurrentUser.Id;

			var schema = UserConnection.EntitySchemaManager.GetInstanceByName("GitSettings");
			var entity = schema.CreateEntity(UserConnection);
			entity.SetDefColumnValues();
			if (!entity.FetchFromDB("SysAdminUnit", sysUserId))
			{
				entity.PrimaryColumnValue = Guid.NewGuid();
				entity.SetColumnValue("SysAdminUnitId", sysUserId);
			}
			entity.SetColumnValue("Settings", settings);
			entity.Save();
			
			var settingsDict = JsonConvert.DeserializeObject<Dictionary<string, object>>(settings);

			if (settingsDict.ContainsKey("email") && settingsDict.ContainsKey("name"))
			{
				var git = new GitHelper(WorkingDirectory);
				git.GitConfig(settingsDict["email"].ToString(), settingsDict["name"].ToString());
			}
			
			return "OK";
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string ReadSettings()
		{
			var sysUserId = UserConnection.CurrentUser.Id;

			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "GitSettings");
			esq.UseAdminRights = false;
			esq.AddAllSchemaColumns();
			esq.PrimaryQueryColumn.IsAlwaysSelect = true;
			esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "SysAdminUnit", sysUserId));
			EntityCollection entities = esq.GetEntityCollection(UserConnection);

			if (entities.Count > 0)
			{
				return entities[0].GetTypedColumnValue<string>("Settings");
			}

			return "{}";
		}

		[OperationContract]
		[WebInvoke(Method = @"POST", RequestFormat = WebMessageFormat.Json, BodyStyle = WebMessageBodyStyle.Wrapped, ResponseFormat = WebMessageFormat.Json)]
		public string GetChangedItems()
		{
			var git = new GitHelper(WorkingDirectory);
			var items = git.GetChangedItems();

			var fileList = new List<GitFileInfo>();

			foreach (var item in items)
			{
				if (item.Type == GitHelper.ItemType.Directory)
				{
					fileList.Add(new GitFileInfo() { Id = Guid.NewGuid(), Name = "📁 " + item.FullPath.Replace(WorkingDirectory, ""), FullPath = item.FullPath, Type = "Directory" });
				}

				if (item.Type == GitHelper.ItemType.File)
				{
					fileList.Add(new GitFileInfo() { Id = Guid.NewGuid(), Name = "⠀⠀📄 " + Path.GetFileName(item.FullPath), FullPath = item.FullPath, Type = "File" });
				}
			}

			var response = new Response();
			response.Files = fileList;
			response.CurrentBranch = git.GitGetCurrentBranch().Result;

			return Newtonsoft.Json.JsonConvert.SerializeObject(response);
		}
	}
}
