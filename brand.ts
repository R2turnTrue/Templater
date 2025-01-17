import { ensureFile } from "https://deno.land/std@0.126.0/fs/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v0.20.1/prompt/mod.ts";
import { colors } from "https://deno.land/x/cliffy@v0.20.1/ansi/colors.ts";

const remoteURL = await Deno.run({
    cmd: ["git", "config", "--get", "remote.origin.url"],
    stdout: "piped"
}).output()

const remoteURLOutput = new TextDecoder().decode(remoteURL)

const remoteURLSegment = (remoteURLOutput.match(/(?<=\/)[\w-]+\/[\w-]+/) as string[])[0]

const generatePackageName = (projectName: string) => (projectName.match(/^(?:(?!Extension).)*/i) as string[])[0].toLowerCase()

const directoryName = (Deno.cwd().match(/\w+(?!\/)$/) as string[])[0]

const repoName: string = await Input.prompt(`Enter repository name${remoteURLSegment ? ` (${remoteURLSegment})` : ""}.`) || remoteURLSegment
const projectName: string = await Input.prompt(`Enter the project name (${directoryName}).`) || directoryName
const preferredMainClass: string = await Input.prompt(`Enter the preferred class name (${projectName}).`) || projectName

const assumedPackageName = generatePackageName(projectName)

const packageName: string = await Input.prompt(`Enter the preferred package name (${assumedPackageName}).`) || assumedPackageName
const description: string = await Input.prompt({ message: "Enter project description.", minLength: 1 })

const paths = {
    properties: "./gradle.properties",
    readme: "./README.md",
    settings: "./settings.gradle.kts",
    code: `./src/main/kotlin/xyz/r2turntrue/${packageName}/${preferredMainClass}.kt`,
}

await Deno.writeTextFile(paths.properties, `# suppress inspection "UnusedProperty" for whole file - used in extension.json
kotlin.code.style=official
name=${projectName}
mainClass=${preferredMainClass}
group=xyz.r2turntrue.${packageName}
version=1.0.0`)

await Deno.writeTextFile(paths.readme, `# ${projectName}
[![license](https://img.shields.io/github/license/${repoName}?style=for-the-badge&color=b2204c)](../LICENSE)
[![wiki](https://img.shields.io/badge/documentation-wiki-74aad6?style=for-the-badge)](https://project-cepi.github.io/)
[![discord-banner](https://img.shields.io/discord/706185253441634317?label=discord&style=for-the-badge&color=7289da)](https://discord.cepi.world/8K8WMGV)

${description}

## Installation

Download the jar from [Releases](https://github.com/${repoName}/releases)
OR compile it yourself. Instructions to do so are in Compile header

Drop it into the \`/extensions\` folder.

## Compile

Create a folder, then
Clone the repository using:

\`git clone https://github.com/${repoName}.git\`

Once it is cloned, make sure you have gradle installed, and run

\`./gradlew build\` on Mac or Linux, and

\`gradlew build\` on Windows.

This will output the jar to \`build/libs\` in the project directory.

**Make sure to select the -all jar**. If no shading is necessary, remove the \`shadowJar\`
`)

await Deno.writeTextFile(paths.settings, `rootProject.name = "${projectName}"
`)

await Deno.remove("./src/main/kotlin", { recursive: true })

await ensureFile(paths.code)

await Deno.writeTextFile(paths.code, `package xyz.r2turntrue.${packageName}

import net.minestom.server.extensions.Extension;

class ${preferredMainClass} : Extension() {

    override fun initialize(): LoadStatus {
        logger().info("[${projectName}] has been enabled!")

        return LoadStatus.SUCCESS
    }

    override fun terminate() {
        logger().info("[${projectName}] has been disabled!")
    }

}
`)

console.log(" ")
console.log("🚀", colors.bold.green("Rebranded files. Have fun koding!"))
