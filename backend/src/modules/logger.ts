export const colors: { [x: string]: string } = {
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	grey: '\x1b[37m\x1b[2m',

	blackBright: '\x1b[30m\x1b[1m',
	redBright: '\x1b[31m\x1b[1m',
	greenBright: '\x1b[32m\x1b[1m',
	yellowBright: '\x1b[33m\x1b[1m',
	blueBright: '\x1b[34m\x1b[1m',
	magentaBright: '\x1b[35m\x1b[1m',
	cyanBright: '\x1b[36m\x1b[1m',
	whiteBright: '\x1b[37m\x1b[1m',
	greyBright: '\x1b[37m\x1b[2m\x1b[1m',

	BGblack: '\x1b[40m',
	BGred: '\x1b[41m',
	BGgreen: '\x1b[42m',
	BGyellow: '\x1b[43m',
	BGblue: '\x1b[44m',
	BGmagenta: '\x1b[45m',
	BGcyan: '\x1b[46m',
	BGwhite: '\x1b[47m',
	BGgrey: '\x1b[47m\x1b[2m',

	BGblackBright: '\x1b[40m\x1b[1m',
	BGredBright: '\x1b[41m\x1b[1m',
	BGgreenBright: '\x1b[42m\x1b[1m',
	BGyellowBright: '\x1b[43m\x1b[1m',
	BGblueBright: '\x1b[44m\x1b[1m',
	BGmagentaBright: '\x1b[45m\x1b[1m',
	BGcyanBright: '\x1b[46m\x1b[1m',
	BGwhiteBright: '\x1b[47m\x1b[1m',
	BGgreyBright: '\x1b[47m\x1b[2m\x1b[1m',

	BGblackDark: '\x1b[2m\x1b[40m\x1b[37m\x1b[1m',
	BGredDark: '\x1b[2m\x1b[41m\x1b[37m\x1b[1m',
	BGgreenDark: '\x1b[2m\x1b[42m\x1b[37m\x1b[1m',
	BGyellowDark: '\x1b[2m\x1b[43m\x1b[37m\x1b[1m',
	BGblueDark: '\x1b[2m\x1b[44m\x1b[37m\x1b[1m',
	BGmagentaDark: '\x1b[2m\x1b[45m\x1b[37m\x1b[1m',
	BGcyanDark: '\x1b[2m\x1b[46m\x1b[37m\x1b[1m',
	BGwhiteDark: '\x1b[2m\x1b[47m\x1b[37m\x1b[1m',
	BGgreyDark: '\x1b[2m\x1b[47m\x1b[2m\x1b[37m\x1b[1m',

	reset: '\x1b[0m',
};

export function colorize(text: string, color: keyof typeof colors): string {
	return colors[color] + text + colors.reset;
}

export function logError(error: Error | unknown, origin: string, type?: ('manager' | 'cluster' | 'worker' | 'unknown'), ...additionalData: unknown[]): void {
	if ((error as Error)?.name?.includes('Unknown interaction') || (error as Error)?.name?.includes('InteractionNotReplied')) return;
	if (!type) type = 'unknown';

	console.error(
		LoggerModule(`${type.charAt(0).toUpperCase() + type.slice(1)} Error [${origin}]`, '|------------|\n', 'red', false, false),
		error, '\n', ...additionalData, '\n',
	);
}

export default function LoggerModule(logType: string, input: string, color: ('black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey'), newLine?: boolean, log = true): string | null {
	const useTime = true;

	const type: string = logType ? ' ' + colorize(` ${logType} `, `BG${color}Bright`) : ' ';
	const text: string = ' ' + colorize(input, `${color}Bright`);
	const time: string = useTime ? colorize(` ${new Date().toLocaleString('en-UK', { timeZone: 'Europe/Zagreb' }).split(', ')[1]} `, `BG${color}Bright`) : '';

	if (log) console.log((newLine ? '\n' : '') + colorize(' • ', `BG${color}Bright`) + ' ' + time + type + text);
	return log ? null : (newLine ? '\n' : '') + colorize(' • ', `BG${color}Bright`) + ' ' + time + type + text;
}
