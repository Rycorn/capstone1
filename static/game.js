$(function() {
    const BASE_URL = "https://capstone1-4e6r.onrender.com";
    const card_URL = 'https://deckofcardsapi.com/api/deck';
    const back_of_card_URL = 'https://deckofcardsapi.com/static/img/back.png';
    let user;
    let deckData;
    let playerCardData;
    let dealerCardData;
    let betTotal;
    let bank;

    async function betSetup()
    {
      $('#menu-box').attr('hidden', true);
      $('#bet-container').removeAttr('hidden');
      checkChips(bank)
      $('#bank').text("Bank: $" + bank);
      $('#bet-total').text("");
      $('#last-bet').attr("src", "");
      betTotal = 0;
      let betPool = [];
      let betChipPool = [];

      $('#bet-chip-box').on("click", async function (evt) 
      {
        let id = evt.target.id;
        $('#last-bet').attr("src",evt.target.src);
        betTotal += Number(id);
        bank -= Number(id);
        betPool.push(id);
        betChipPool.push(evt.target.src);
        $('#bet-total').text("$ " + betTotal);
        $('#bank').text("Bank: $" + bank);
        $('#deal-button').removeAttr('hidden');
        checkChips(bank)
      });
      $('#bet-total-box').on("click", "#last-bet", async function (evt) 
      {
        if(betPool.length > 0)
        {
          let putBack = betPool.pop();
          if(putBack !== undefined && putBack !== NaN)
          {
            betTotal -= Number(putBack);
            bank += Number(putBack);

            $('#last-bet').attr("src", betChipPool.pop());
            $('#bet-total').text("$ " + betTotal);
            $('#bank').text("Bank: $" + bank);
            checkChips(bank)
          }
        }
        if(betPool.length == 0)
        {
          $('#bet-total').text("");
          $('#last-bet').attr("src", "");
          $('#deal-button').attr('hidden', true);
          checkChips(bank);
        }
      });
      $('#deal-button').on("click", async function (evt) 
      {
        $('#bet-container').attr('hidden', true);
        betPool = [];
        betChipPool = [];
        dealCards();
      });
    }

    function checkChips(bank)
    {
      let chipBox = $('#chip-box')
      for(let i = 0; i < chipBox[0].childElementCount; i++)
      {
        let child = chipBox[0].children[i];
        if(bank > Number(child.id))
        {
          child.hidden = false;
        }
        else
        {
          child.hidden = true;
        }
      }
    }

    async function dealCards()
    {
      let $dealerCardArea = $('#dealer-card-area');
      let $playerCardArea = $('#player-card-area');

      playerCardData = await $.getJSON(`${card_URL}/${deckData.deck_id}/draw/?count=2`);
      $playerCardArea.append(
      $('<img>', {
          src: playerCardData.cards[0].image,
      }), 
      $('<img>', {
          src: playerCardData.cards[1].image,
      })
      );
      dealerCardData = await $.getJSON(`${card_URL}/${deckData.deck_id}/draw/?count=2`);
      $dealerCardArea.append(
        $('<img>', {
            src: dealerCardData.cards[0].image,
        }), 
        $('<img>', {
            src: back_of_card_URL,
        })
      );

      $('#menu-box').removeAttr('hidden');

      
    }
    async function gameMenu()
    {
      let $dealerCardArea = $('#dealer-card-area');
      let $playerCardArea = $('#player-card-area');

      $("#game-container").on("click", "#add", async function (evt) 
      {
        addCard("player").then(data => 
        {
            let playerHandValue = getHandValue("player");
            if(playerHandValue > 21)
            {
              $("#results").text("Bust")
              let cardId = 0;
              for(let card of $dealerCardArea.children())
              {
                  card.src = dealerCardData.cards[cardId].image;
                  cardId++
              }
              lostGame()
              setTimeout(() => {
                  $("#results").text("")
                  gameReset()
              }, 3000);
            }
        });
      });

      $("#game-container").on("click", "#hold", async function (evt) {
        let cardId = 0;
        for(let card of $dealerCardArea.children())
        {
            card.src = dealerCardData.cards[cardId].image;
            cardId++
        }
        let playerHandValue = getHandValue("player");
        let dealerHandValue = getHandValue("dealer");

        dealerHandValue = await dealerGetCards(dealerHandValue)

        if(dealerHandValue > 21)
        {
            $("#results").text("Dealer bust")
            wonGame()
        }
        else if(playerHandValue > dealerHandValue)
        {
            $("#results").text("You win")
            wonGame()
        }
        else
        {
            $("#results").text("You lose")
            lostGame()
        }

        setTimeout(() => {
            $("#results").text("")
            gameReset()
        }, 3000);
      });
    }

    async function addCard(person) 
    {
      newCardData = await $.getJSON(`${card_URL}/${deckData.deck_id}/draw/`);
      if(person == "player")
      {
        for(let card of newCardData.cards)
        {
          playerCardData.cards.push(card);
        }
        $('#player-card-area').append(
          $('<img>', {
            src: newCardData.cards[0].image,
          })
        );
      }
      if(person == "dealer")
      {
        for(let card of newCardData.cards)
        {
          dealerCardData.cards.push(card);
        }
        $('#dealer-card-area').append(
          $('<img>', {
            src: newCardData.cards[0].image,
          })
        );
      }
    }
    function getHandValue(person)
    {
      let handValue = 0
      let aceCount = 0;
      if(person == "player")
      {
        for(let card of playerCardData.cards)
        {
          if(card.value == "JACK" || card.value == "QUEEN" || card.value == "KING")
          {
              handValue += 10;
          }
          else if(card.value == "ACE")
          {
            aceCount++;
          }
          else
          {
            handValue += parseInt(card.value);
          }
        }
      }
      if(person == "dealer")
      {
        for(let card of dealerCardData.cards)
        {
          if(card.value == "JACK" || card.value == "QUEEN" || card.value == "KING")
            {
                handValue += 10;
            }
            else if(card.value == "ACE")
            {
              aceCount++;
            }
            else
            {
              handValue += parseInt(card.value);
            }
        }
      }
      for(let i = 0; i < aceCount; i++)
      {
        if(handValue+11 < 22)
        {
          handValue += 11;
        }
        else
        {
          handValue += 1;
        }
      }
      return handValue
    }
    async function dealerGetCards(initial)
    {
      let dealerHandValue = initial
      while(dealerHandValue < 17)
      {
        await addCard("dealer");
        setTimeout(() => {
          
        }, 1000);
        dealerHandValue = getHandValue("dealer");
      }
      return dealerHandValue;
    }

    async function gameReset() {
      bank = user.funds;
      betTotal = 0;

      $('#menu-box').attr('hidden', true);
      let $dealerCardArea = $('#dealer-card-area');
      let $playerCardArea = $('#player-card-area');
      for(let card of $dealerCardArea.children())
      {
        card.remove();
      }
      for(let card of $playerCardArea.children())
      {
        card.remove();
      }

      $('#bet-container').removeAttr('hidden');
      checkChips(bank)
      $('#bank').text("Bank: $" + bank);
      $('#bet-total').text("");
      $('#last-bet').attr("src", "");

      await $.getJSON(`${card_URL}/${deckData.deck_id}/return/`);
      await $.getJSON(`${card_URL}/${deckData.deck_id}/shuffle/`);
      
      //betSetup()
    }

    async function lostGame() 
    {
        user.funds -= parseInt(betTotal);
        let userName = user.userName;
        let password = user.password;
        let funds = user.funds;
        let temp = await axios.patch(`${BASE_URL}/${user.userName}`, {
          userName,
          password,
          funds
        });
        user = temp.data.user
    }
    async function wonGame() {
        user.funds += 2*parseInt(betTotal);
        let username = user.userName;
        let password = user.password;
        let funds = user.funds;
        let temp = await axios.patch(`${BASE_URL}/${username}`, {
          username,
          password,
          funds
        });
        user = temp.data.user
    }
  
    async function setup() {
      deckData = await $.getJSON(`${card_URL}/new/shuffle/?deck_count=2`)

      let username = $('#user-name').text();
      let response = await axios.get(`${BASE_URL}/${username}`);
      user = response.data.user;
      bank = user.funds;
      betSetup();
      gameMenu();
      //dealCards();
    }
    setup();
  });
