$(function() {
    const BASE_URL = "http://localhost:5000";
    const card_URL = 'https://deckofcardsapi.com/api/deck';
    const back_of_card_URL = 'https://deckofcardsapi.com/static/img/back.png';
    let user;
    let deckData;
    let playerCardData;
    let dealerCardData;
  
    /** given data about a cupcake, generate html */
  
    function generateGameBoxHTML(user) {
      return `
        <div id="menu-box">
              <p id="funds">Funds: ${user.funds}</p>  
              <form id="gameform">
                  <div id="bet">
                      Bet:
                      <input type="radio" name="bet" value="1" checked> 1 <br>
                      <input type="radio" name="bet" value="5"> 5 <br>
                      <input type="radio" name="bet" value="10"> 10 <br>
                      <input type="radio" name="bet" value="20"> 20 <br>
                  </div>
                  <div id="game-button-container">
                      <button id="add" type="button">Add</button>
                      <button id="hold" type="button">Hold</button>
                      <button id="fold" type="button">Fold</button>
                  </div>  
              <form>
              
          </div>
      `;
    }
  
  

  
    async function gameSetup() {
        let $dealerCardArea = $('#dealer-card-area');
        let $playerCardArea = $('#player-card-area');
        let username = $('#user-name').text();
        let response = await axios.get(`${BASE_URL}/${username}`);
        user = response.data.user;
        console.log(user);

      
        let newGameBox = $(generateGameBoxHTML(user));
        $("#game-container").append(newGameBox);

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

        $("#game-container").on("click", "#add", async function (evt) {
        addCard("player").then(data => {
            let playerHandValue = getHandValue("player");
            console.log("player hand " + playerHandValue)
            if(playerHandValue > 21)
            {
            console.log("bust")
            $("#results").text("Bust")
            let cardId = 0;
            for(let card of $dealerCardArea.children())
            {
                card.src = dealerCardData.cards[cardId].image;
                cardId++
            }
            setTimeout(() => {
                $("#results").text("")
                lostGame()
            }, 3000);
            }
        });
        });
        
        $("#game-container").on("click", "#fold", async function (evt) {
        lostGame()
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
        console.log(playerCardData);
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
      await $.getJSON(`${card_URL}/${deckData.deck_id}/return/`);
      await $.getJSON(`${card_URL}/${deckData.deck_id}/shuffle/`);
  
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
      let newfunds = "Funds: " + user.funds
      $("#funds").text(newfunds)
    }
    async function lostGame() {
      let betValue = $('input[name=bet]:checked', '#gameform').val()
        user.funds -= parseInt(betValue);
        let userName = user.userName;
        let password = user.password;
        let funds = user.funds;
        let temp = await axios.patch(`${BASE_URL}/users/${user.id}`, {
          userName,
          password,
          funds
        });
        user = temp.data.user
    }
    async function wonGame() {
      let betValue = $('input[name=bet]:checked', '#gameform').val()
        user.funds += 2*parseInt(betValue);
        let userName = user.userName;
        let password = user.password;
        let funds = user.funds;
        let temp = await axios.patch(`${BASE_URL}/users/${user.id}`, {
          userName,
          password,
          funds
        });
        user = temp.data.user
    }
  
    async function setup() {
      deckData = await $.getJSON(`${card_URL}/new/shuffle/?deck_count=2`)
      gameSetup();
    }
    setup();
  });