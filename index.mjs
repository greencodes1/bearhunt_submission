import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask, yesno } from '@reach-sh/stdlib/ask.mjs';

const stdlib = loadStdlib();

const Deployername = await ask(`what is your name Deployer `)
const playername = await ask(`what is your name player `)

const accDeployer = await stdlib.newTestAccount(stdlib.parseCurrency(17000));
const accplayer = await stdlib.newTestAccount(stdlib.parseCurrency(2000));

const ctcDeployer = accDeployer.contract(backend);

const ctcplayer = accplayer.contract(backend, ctcDeployer.getInfo())
console.log(`Welcome ${Deployername} and ${playername}`)


const getbalance = async (acc, names) => {
    const bal = await stdlib.balanceOf(acc);
    console.log(`${names} has ${stdlib.formatCurrency(bal)} ${stdlib.standardUnit} tokens`)
}

await getbalance(accDeployer, Deployername)
await getbalance(accplayer, playername)
await Promise.all([
    backend.Deployer(ctcDeployer, {
        pay_value: stdlib.parseCurrency(await ask(`How much are you depositing into the contract ${Deployername} `)),
        deadline_time: parseInt(await ask(`${Deployername} enter the timeout for the contract`)),
        Deployer_decision: async () => {
            const Decision = await ask(`${Deployername} have you changed your mind to continue the game or end it\n enter no to continue contract and yes to end contract: `)
            if (Decision == "yes") {
                console.log(`${Deployername} has decided to end contract and take their money from the contact`)
                return false
            } else if (Decision == "no") {
                console.log(`${Deployername} want the contract to continue`)
                return true
            }
        },
        informdeadline: async (num) => {
            console.log(`${Deployername} the timeout is now ${num} `)
        },
        question: async (num) => {
            const ques = await ask(`Enter your question ${Deployername}:`)
            console.log(`Question: ${ques}`)
            return true
        },

    }),
    backend.player(ctcplayer, {
        Accept: async (amt) => {
            console.log(`${playername} saw the ${Deployername} deposit ${stdlib.formatCurrency(amt)} ${stdlib.standardUnit} algos`)
            const player_choice = await ask(`${playername} do you want to proceed with the game\n1 for yes 0 for no: `)
            if (parseInt(player_choice) == 1) {
                console.log(`${playername} agreed to play game`)
                return parseInt(player_choice)
            } else if (parseInt(player_choice) == 0) {
                console.log(`${playername} opted-out of game`)
                return parseInt(player_choice)
            }
        },
        informdeadline: async (num) => {
            console.log(`${playername} the timeout is now ${num} `)
        },
        answer: async (boolean_val) => {
            const answer = await ask(`Enter answer to question ${playername}:`)
            const bl = boolean_val
            if (answer == Deployername) {
                console.log(`${playername} got the answer to the question`)
                return parseInt(1)
            } else {
                console.log(`${playername} couldn't guess the answer`)
                return parseInt(0)
            }
        },

    }),

]);

await getbalance(accDeployer, Deployername)
await getbalance(accplayer, playername)
process.exit()
