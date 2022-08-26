import { type Argv } from "yargs";
import { logger } from "../../../../logger";
import * as Client from "../../../client";
import * as Config from "../../config";

interface Args extends Config.Args {
	["queue-name"]: string;
	["script-name"]: string;
	["environment"]: string | undefined;
	["batch-size"]: number | undefined;
	["batch-timeout"]: number | undefined;
	["message-retries"]: number | undefined;
	["dead-letter-queue"]: string | undefined;
}

export function Options(yargs: Argv): Argv<Args> {
	return yargs
		.positional("queue-name", {
			type: "string",
			demandOption: true,
			description: "Name of the queue to configure",
		})
		.positional("script-name", {
			type: "string",
			demandOption: true,
			description: "Name of the consumer script",
		})
		.options({
			environment: {
				type: "string",
				describe: "Environment of the consumer script",
			},
			"batch-size": {
				type: "number",
				describe: "Maximum number of messages per batch",
			},
			"batch-timeout": {
				type: "number",
				describe:
					"Maximum number of seconds to wait to fill a batch with messages",
			},
			"message-retries": {
				type: "number",
				describe: "Maximum number of retries for each message",
			},
			"dead-letter-queue": {
				type: "string",
				describe: "Queue to send messages that failed to be consumed",
			},
		});
}

export async function Handler(args: Args) {
	const config = Config.read(args);

	const body: Client.PostConsumerBody = {
		script_name: args["script-name"],
		// TODO(soon) is this still the correct usage of the environment?
		environment_name: args.environment || "", // API expects empty string as default
		settings: {
			batch_size: args["batch-size"],
			max_retries: args["message-retries"],
			max_wait_time_ms: args["batch-timeout"] // API expects milliseconds
				? 1000 * args["batch-timeout"]
				: undefined,
		},
		dead_letter_queue: args["dead-letter-queue"],
	};

	logger.log(`Adding consumer to queue ${args["queue-name"]}.`);
	await Client.PostConsumer(config, args["queue-name"], body);
	logger.log(`Added consumer to queue ${args["queue-name"]}.`);
}