'reach 0.1';

export const main = Reach.App(() => {
    const Deployer = Participant('Deployer', {
        pay_value: UInt,
        deadline_time: UInt,
        Deployer_decision: Fun([], Bool),
        informdeadline: Fun([UInt], Null),
        question: Fun([], Bool),
    })
    const player = Participant('player', {
        informdeadline: Fun([UInt], Null),
        Accept: Fun([UInt], UInt),
        answer: Fun([Bool], UInt)
    })

    init()
    Deployer.only(() => {
        const pay_value = declassify(interact.pay_value)
        const time = declassify(interact.deadline_time)
        const ques = declassify(interact.question())
    })
    Deployer.publish(pay_value, time, ques)
        .pay(pay_value)
    commit()

    player.only(() => {
        const check_accept = declassify(interact.Accept(pay_value))
    })
    player.publish(check_accept)
    commit()
    each([Deployer, player], () => {
        interact.informdeadline(time)
    })
    Deployer.publish()
    const trying = (num) => {
        if (num == 1) {
            const end_time = lastConsensusTime() + time
            var [Deployer_decision, player_ans] = [true, 0]
            invariant(balance() == pay_value)
            while (lastConsensusTime() <= end_time && player_ans == 0) {
                commit()
                player.only(() => {
                    const ans = declassify(interact.answer(ques))
                })
                player.publish(ans)
                commit()
                Deployer.only(() => {
                    const Deployerdecision = declassify(interact.Deployer_decision())
                })
                Deployer.publish(Deployerdecision)

                if (Deployerdecision) {
                    [Deployer_decision, player_ans] = [Deployerdecision, ans]
                    continue
                } else {
                    [Deployer_decision, player_ans] = [false, 0]
                    continue
                }

            }
            if (Deployer_decision == true && player_ans == 1) {
                return player
            } else {
                return Deployer
            }

        } else {
            return Deployer
        }
    }
    const getaddress = trying(check_accept)
    transfer(pay_value).to(getaddress)
    commit()

});
