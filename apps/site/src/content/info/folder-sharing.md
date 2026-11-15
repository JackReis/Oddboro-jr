# Giving an Odd a folder

Give each Odd the smallest folder its work needs. An Odd can open everything inside a folder you give it, so a project folder is safe to give, and a whole drive is not.

## What a folder lets an Odd do

You give a folder on the Odd's Settings, under Folders. Each folder is set to one of two levels.

- **Can read** lets the Odd open and read every file inside the folder, and every folder inside it.
- **Can write** also lets it create, change and delete those files.

Even with Can write, an Odd never changes another AI tool's instruction files there, such as `CLAUDE.md`, `AGENTS.md` or a `.claude` folder, or git's hooks and settings. It can still change a project's own code, such as its package scripts or tests. Look at what an Odd changed before you run that project's tools yourself.

The change takes effect on the Odd's next run. Click ✕ beside a folder to take it back.

## Reviewing work from another tool

Save the result you want reviewed in a project folder on the computer running Oddboro. A terminal report, a downloaded GitHub build log or a file from a synced drive works once the file is available on that computer. For a job in WSL, save the result in a project folder you can open from Windows. Give the reviewing Odd **Can read** on that folder. In chat, name the file and ask what it shows. If the file is missing, check the saved path on the office computer and the folder listed under that Odd's Settings.

For example, to review a Multica teammate's answer, open a terminal in the folder you want to share. With the Multica CLI signed in, replace `ISSUE-ID` with the issue identifier and save its comments:

```sh
multica issue comment list ISSUE-ID --output json --full > review.json
```

Ask your Odd, “Read review.json. What did the reviewer clear, what is still on hold, and which records support the answer?” The file contains the comments at the time you saved it. Run the command again to share later replies. Reading this copy leaves the original assignment in Multica. [Multica CLI guide](https://multica.ai/docs/cli)

For a live review through an existing Multica connection, open the Odd's Access tab, choose **Add service** and paste your team's hosted MCP server address. Choose **Read only** and finish the account or key step on the Desk. Review the tools marked **reads only** before you confirm. Ask the Odd for the latest reply on a specific issue. If the service exposes no tools at that level, use the saved comments above.

## Folders Oddboro never gives

These folders would let an Odd past the limits you set for it, so Oddboro refuses them and offers no way around it:

- **Your whole home folder.** Pick a folder inside it instead.
- **Your keys and sign-ins.** Folders like `.ssh`, `.aws` and `.gnupg`, and folders that hold one.
- **Other AI tools' homes.** The folders where Claude Code, Codex, Grok and Gemini keep their sign-ins and history, such as `~/.claude` and `~/.codex`.
- **Oddboro itself.** The office's own folder, `~/.oddboro`, and Oddboro's code. An Odd that could change these could change its own access.

Oddboro knows the ones at the top of your home folder by name; everywhere else, inside your home or on another drive, it looks in the folder you pick, the folders it sits in, and the folders directly inside it for the files only these folders hold. It does not look deeper. Before you give a folder, make sure nothing deeper inside it holds keys or sign-ins.

## Why some folders warn first

Oddboro warns you before it gives a folder that is a whole drive, like `D:\` or a disk under `/Volumes`, or that holds your computer's system files, like `C:\Windows` or `/usr`. You see a warning with Accept and Cancel. Only Accept gives the folder.

We don't recommend it. A whole drive can hold things you forgot are there, like old backups, other people's files, or another tool's sign-ins deep inside. System files are what your computer runs on. Give the project folder the work is in instead.

An Odd can ask you for a folder, but never for a whole drive or system files. Only you can give one.

## Folders outside your home

A folder on another drive works the same as one in your home. If your projects live on `D:\Projects`, give `D:\Projects\my-game`, the folder the work is in.
