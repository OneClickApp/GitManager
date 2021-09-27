namespace Terrasoft.Configuration
{
	using System;
	using System.Collections.Generic;
	using System.Linq;
	using System.Text;
	using System.Threading.Tasks;
	using System.Diagnostics;
	using Newtonsoft.Json;
	using Newtonsoft.Json.Converters;
	using System.Threading;
	using Terrasoft.Messaging.Common;
	public class GitHelper
	{
		string workingDirectory;

		public enum ItemStatus
		{
			Add,
			Edit,
			Delete,
			None
		}

		public enum ItemType
		{
			File,
			Directory,
			None
		}

		public class OperationResult
		{
			public bool Success { get; set; }
			public string Result { get; set; }
			public string ErrorDescription { get; set; }
		}

		public class GitItem
		{
			public string DirectoryPath { get; set; }
			public string FullPath { get; set; }
			[JsonConverter(typeof(StringEnumConverter))]
			public ItemStatus Status { get; set; }
			[JsonConverter(typeof(StringEnumConverter))]
			public ItemType Type { get; set; }
		}

		public GitHelper(string workingDirectory)
		{
			this.workingDirectory = workingDirectory;
		}

		public OperationResult GitPull(string branch)
		{
			return RunGit("pull -v --progress origin " + branch);
		}

		public OperationResult GitGetCurrentBranch()
		{
			return RunGit("rev-parse --abbrev-ref HEAD");
		}

		public OperationResult GitRestore(List<GitItem> items)
		{
			foreach (var item in items)
			{
				if (item.Status != ItemStatus.Add)
				{
					var result = RunGit("restore " + item.FullPath);
					if (!result.Success)
					{
						return result;
					}
				}
				else
				{
					System.IO.File.Delete(item.FullPath);
				}
			}

			return new OperationResult() { Success = true, Result = "Success" };
		}

		public OperationResult GitRemoteAdd(string url)
		{
			return RunGit("remote set-url origin " + url);
		}

		public OperationResult GitBranch(string name)
		{
			var branch = RunGit("branch " + name);
			if (!branch.Success)
			{
				return branch;
			}

			var checkout = GitCheckout(name);
			if (!checkout.Success)
			{
				return checkout;
			}

			var push = RunGit("push --set-upstream origin " + name);
			if (!push.Success)
			{
				return push;
			}

			return push;
		}

		public OperationResult GitConfig(string email, string name)
		{
			RunGit("config user.email \"" + email + "\"");
			return RunGit("config user.name \"" + name + "\"");
		}

		public OperationResult GitCheckout(string branchName)
		{
			return RunGit("checkout " + branchName);
		}

		public OperationResult GitPush()
		{
			return RunGit("push");
		}

		public OperationResult GitCommit(string comment)
		{
			if (String.IsNullOrEmpty(comment))
			{
				var result = new OperationResult();
				result.Success = false;
				result.Result = "comment is empty!";
				return result;
			}

			return RunGit("commit -m \"" + comment + "\"");
		}

		public OperationResult AddItemsToCommit(List<GitItem> items)
		{
			if (items.Count == 0)
			{
				var result = new OperationResult();
				result.Success = false;
				result.ErrorDescription = "items is empty";
				return result;
			}

			var gitCommand = "add";

			foreach (var item in items)
			{
				if (item.Type != ItemType.Directory)
				{
					gitCommand += " \"" + item.FullPath + "\"";
				}
			}

			return RunGit(gitCommand);
		}

		public List<GitItem> GetChangedItems()
		{
			var items = new List<GitItem>();
			var gitResult = RunGit("status --porcelain");

			if (gitResult.Success)
			{
				foreach (var item in gitResult.Result.Split('\n'))
				{
					var tItem = item.Trim();
					if (tItem.Contains(" "))
					{
						var status = tItem.Split(' ')[0].Trim();
						var path = tItem.Split(' ')[1].Trim();

						var itemType = GetItemType(path);
						var itemStatus = GetItemStatus(status);

						if (itemType == ItemType.Directory && itemStatus == ItemStatus.Add)
						{
							items.AddRange(GetItemsFromDirectory(path));
						}

						if (itemType != ItemType.Directory)
						{
							var gitItem = new GitItem();
							gitItem.DirectoryPath = new System.IO.FileInfo(System.IO.Path.Combine(workingDirectory, path)).DirectoryName;
							gitItem.FullPath = new System.IO.FileInfo(System.IO.Path.Combine(workingDirectory, path)).FullName;
							gitItem.Status = itemStatus;
							gitItem.Type = itemType;

							items.Add(gitItem);
						}
					}
				}
			}

			var dirs = items.Select(x => x.DirectoryPath).Distinct().ToList();

			foreach (var dir in dirs)
			{
				items.Add(new GitItem() { DirectoryPath = dir, FullPath = dir, Status = ItemStatus.None, Type = ItemType.Directory });
			}

			return items.OrderBy(x => x.FullPath).ToList();
		}

		private List<GitItem> GetItemsFromDirectory(string path)
		{
			var items = new List<GitItem>();

			foreach (var item in System.IO.Directory.GetFiles(System.IO.Path.Combine(workingDirectory, path), "*.*", System.IO.SearchOption.AllDirectories))
			{
				var gitItem = new GitItem();
				gitItem.DirectoryPath = new System.IO.FileInfo(item).DirectoryName;
				gitItem.FullPath = new System.IO.FileInfo(item).FullName;
				gitItem.Status = ItemStatus.Add;
				gitItem.Type = ItemType.File;

				items.Add(gitItem);
			}

			return items;
		}

		private ItemStatus GetItemStatus(string status)
		{
			if (status == "M") { return ItemStatus.Edit; }
			if (status == "D")
			{
				return ItemStatus.Delete;
			}
			if (status == "??") { return ItemStatus.Add; }

			return ItemStatus.None;
		}

		private ItemType GetItemType(string path)
		{
			if (System.IO.File.Exists(System.IO.Path.Combine(workingDirectory, path))) { return ItemType.File; }
			if (System.IO.Directory.Exists(System.IO.Path.Combine(workingDirectory, path))) { return ItemType.Directory; }

			return ItemType.None;
		}

		private OperationResult RunGit(string command)
		{
			var logString = "";

			logString += $"command: {command}\r\n";
			logString += $"---------------------------\r\n";

			var result = new OperationResult();

			Process pProcess = new Process();
			pProcess.StartInfo.FileName = "git";
			pProcess.StartInfo.Arguments = command;
			pProcess.StartInfo.UseShellExecute = false;
			pProcess.StartInfo.RedirectStandardOutput = true;
			pProcess.StartInfo.RedirectStandardError = true;
			pProcess.StartInfo.WorkingDirectory = workingDirectory;
			pProcess.Start();

			string strOutput = pProcess.StandardOutput.ReadToEnd();
			string strError = pProcess.StandardError.ReadToEnd();

			logString += $"strOutput: {strOutput}\r\n";
			logString += $"---------------------------\r\n";
			logString += $"strError: {strError}\r\n";

			pProcess.WaitForExit();

			result.Success = true;
			result.Result = strOutput;

			if (strError.IndexOf("error") != -1 || strError.IndexOf("fatal") != -1)
			{
				result.Success = false;
				result.ErrorDescription = strError;
				result.Result += "\r\n" + strError;
			}
			else
			{
				if (!String.IsNullOrEmpty(strError))
				{
					result.Result += "\r\n" + strError;
				}
			}

			SendClientMessage(logString);

			return result;
		}

		class Message : IMsg
		{
			public Guid Id { get; set; }

			public IMsgHeader Header { get; set; }

			public object Body { get; set; }
		}
		class MessageHeader : IMsgHeader
		{
			public string Sender { get; set; }
			public string BodyTypeName { get; set; }
		}

		private void SendClientMessage(object message)
		{
			foreach (var channel in MsgChannelManager.Instance.Channels.Values)
			{
				channel.PostMessage(CreateMessage("Log", message));
			}
		}

		private Message CreateMessage(string bodyType, object body)
		{
			return new Message()
			{
				Id = Guid.NewGuid(),
				Header = new MessageHeader()
				{
					Sender = "GitManager",
					BodyTypeName = bodyType
				},
				Body = JsonConvert.SerializeObject(body)
			};
		}
	}
}