#!/usr/bin/env node
import inquirer from 'inquirer';
import bcrypt from 'bcrypt';
import chalk from 'chalk';
import figlet from 'figlet';
// Title decoration
console.log(chalk.yellow(figlet.textSync("Typing Test", { horizontalLayout: "full" })));
console.log(chalk.bold.green("Improve your WPM speed with our free online typing tests."));
let users = [];
async function main() {
    while (true) {
        const { action } = await inquirer.prompt({
            name: 'action',
            type: 'list',
            message: 'Do you want to sign up or login?',
            choices: ['Signup', 'Login'],
        });
        if (action === 'Signup') {
            await userSignup();
        }
        else {
            await userLogin();
        }
    }
}
async function userSignup() {
    const userDetail = await inquirer.prompt([
        {
            name: 'username',
            type: 'input',
            message: 'Enter your name:',
            validate: (input) => input ? true : 'Name cannot be empty',
        },
        {
            name: 'email',
            type: 'input',
            message: 'Enter your email:',
            validate: validateEmail,
        },
        {
            name: 'password',
            type: 'password',
            message: 'Enter your password:',
            validate: validatePassword,
        },
    ]);
    const hashedPassword = await bcrypt.hash(userDetail.password, 10);
    users.push({
        username: userDetail.username,
        email: userDetail.email,
        password: hashedPassword,
    });
    console.log(chalk.green(`Dear ${userDetail.username}, signup successful! Now you can login.`));
}
async function userLogin() {
    const loginDetails = await inquirer.prompt([
        {
            name: 'email',
            type: 'input',
            message: 'Enter your email:',
            validate: validateEmail,
        },
        {
            name: 'password',
            type: 'password',
            message: 'Enter your password:',
            validate: (input) => input ? true : 'Password cannot be empty',
        },
    ]);
    const matchedUser = users.find(user => user.email === loginDetails.email);
    if (matchedUser) {
        const isPasswordValid = await bcrypt.compare(loginDetails.password, matchedUser.password);
        if (isPasswordValid) {
            console.log(chalk.gray(`Hi, ${matchedUser.username}! \nWelcome to the typing test.\n`));
            console.log(chalk.bold.green('Customize Your Own Typing Test'));
            await startTypingTest();
        }
        else {
            console.log(chalk.red('Invalid password. Please try again.'));
        }
    }
    else {
        console.log(chalk.red('No account found with this email. Please sign up.'));
        const { signupOrLogin } = await inquirer.prompt({
            name: 'signupOrLogin',
            type: 'list',
            message: 'Do you want to sign up or login?',
            choices: ['Signup', 'Login'],
        });
        if (signupOrLogin === 'Signup') {
            await userSignup();
        }
        else {
            await userLogin();
        }
    }
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? true : 'Invalid email format';
}
function validatePassword(password) {
    return password.length >= 6 ? true : 'Password must be at least 6 characters long';
}
async function startTypingTest() {
    const { duration } = await inquirer.prompt({
        type: 'list',
        name: 'duration',
        message: 'Select Your Test Duration',
        choices: ['30 seconds', '1 minute', '2 minutes'],
    });
    const { difficulty } = await inquirer.prompt({
        type: 'list',
        name: 'difficulty',
        message: 'Please Select Your Test Difficulty',
        choices: ['Basic sentences', 'Random words', 'Technical text'],
    });
    console.log(chalk.blueBright('\nWarm-up Exercise: Press Enter to start the warm-up exercise.\n'));
    await inquirer.prompt({ name: 'startWarmup', type: 'input', message: 'Press Enter to start...' });
    const warmupText = 'asdf jkl;';
    console.log(chalk.yellow(`"${warmupText}"\n`));
    const warmupInput = await inquirer.prompt({ name: 'typedWarmupText', type: 'input', message: 'Type here:' });
    if (warmupInput.typedWarmupText.trim() !== warmupText) {
        console.log(chalk.red('\nYour input did not match the warm-up text. Please try again.'));
        await startTypingTest();
        return;
    }
    console.log(chalk.green('\nWarm-up complete!'));
    let sampleText;
    switch (difficulty) {
        case 'Basic sentences':
            sampleText = 'The quick brown fox jumps over the lazy dog';
            break;
        case 'Random words':
            sampleText = 'Lorem ipsum dolor sit amet consectetur adipiscing elit';
            break;
        case 'Technical text':
            sampleText = 'Asynchronous programming is a form of parallel programming';
            break;
        default:
            sampleText = 'The quick brown fox jumps over the lazy dog';
            break;
    }
    console.log(chalk.blueBright('\nYour typing test will start now. Press Enter to start.\n'));
    await inquirer.prompt({ name: 'start', type: 'input', message: 'Press Enter to start...' });
    const testDurationInSeconds = getDurationInSeconds(duration);
    await runTypingTest(testDurationInSeconds, sampleText);
}
function getDurationInSeconds(duration) {
    switch (duration) {
        case '30 seconds':
            return 30;
        case '1 minute':
            return 60;
        case '2 minutes':
            return 120;
        default:
            return 60;
    }
}
async function runTypingTest(testDurationInSeconds, sampleText) {
    const startTime = Date.now();
    let userInput = '';
    let timerExpired = false;
    const timer = setTimeout(() => {
        timerExpired = true;
        console.log(chalk.red("\nTime's up!"));
        endTypingTest(Date.now() - startTime, sampleText, userInput.trim());
    }, testDurationInSeconds * 1000);
    while (!timerExpired) {
        const { typedText } = await inquirer.prompt({
            name: 'typedText',
            type: 'input',
            message: `Sample Text: ${sampleText}\n\nType here:`,
        });
        userInput += typedText + ' ';
        if (userInput.trim() === sampleText)
            break;
    }
    clearTimeout(timer);
    if (!timerExpired) {
        await endTypingTest(Date.now() - startTime, sampleText, userInput.trim());
    }
}
async function endTypingTest(elapsedTime, sampleText, typedText) {
    const timeInSeconds = elapsedTime / 1000;
    const textMatch = typedText === sampleText;
    const wpm = calculateWPM(typedText, timeInSeconds);
    console.log('\n');
    if (textMatch) {
        console.log(chalk.green(`You typed the text correctly in ${timeInSeconds.toFixed(2)} seconds.`));
        console.log(chalk.green(`Your typing speed is ${wpm.toFixed(2)} words per minute.`));
    }
    else {
        console.log(chalk.red(`Your input did not match the sample text.`));
        console.log(chalk.red(`You typed: "${typedText}"`));
        console.log(chalk.red(`Expected: "${sampleText}"`));
    }
    await askToContinue();
}
function calculateWPM(text, timeInSeconds) {
    const words = text.split(' ').filter(word => word).length;
    const minutes = timeInSeconds / 60;
    return words / minutes;
}
async function askToContinue() {
    const { continueTest } = await inquirer.prompt({
        name: 'continueTest',
        type: 'list',
        message: 'What would you like to do next?',
        choices: ['Continue typing test', 'Exit'],
    });
    if (continueTest === 'Continue typing test') {
        console.log(chalk.bold.green('\nCustomize Your Own Typing Test'));
        await startTypingTest();
    }
    else {
        console.log(chalk.yellow('Exiting the typing test. Have a great day!'));
        process.exit();
    }
}
main();
