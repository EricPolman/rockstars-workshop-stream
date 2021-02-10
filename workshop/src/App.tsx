import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { anime } from 'react-anime';
interface CocktailRecipe {
  title: string;
  ingredients: string[];
  instructions: string;
}

const suikerwater: CocktailRecipe = {
  title: "Suikerwater",
  instructions: "Verwarm het water met de suiker en roer Stop beide ingrediënten in een afsluitbare container en sluit deze af. Schud de ingrediënten totdat de suiker in het water is opgelost.",
  ingredients: [
    "100 ml water",
    "100 gram suiker"
  ]
}

const espressoMartini: CocktailRecipe = {
  title: "Espresso Martini",
  instructions: "Voeg alle ingrediënten toe aan de cocktail shaker en vul deze volledig met ijs. Schud hard totdat de shaker super koud is. Open de shaker en schenk de cocktail door een zeef uit in het coupeglas. Heb je koffiebonen? Garneer dan de cocktail met 3 boontjes in het midden.",
  ingredients: [
    "30 ml vodka",
    "30 ml Kahlua",
    "1 kop espresso (ongeveer 30 ml)",
    "10 ml suikerwater",
  ]
}

const rockstarMartini: CocktailRecipe = {
  title: "Rockstar Martini",
  instructions: "Gooi alle ingrediënten in de shaker en sluit deze goed. Vul deze NIET met ijs. Shake hard om de eiwitten op te kloppen. Open de shaker en voeg ijs toe. Schud nog een keer hard totdat de shaker super koud is. Open de shaker en schenk de inhoud door een zeef in het coupeglas. Garneer met een halve passievrucht in het midden.",
  ingredients: [
    "30 ml Bacardi witte rum",
    "30 ml Passoa",
    "15ml limoensap (halve verse limoen ongeveer)",
    "15ml caramelsiroop",
    "15ml maracujasmoothie",
    "Eiwit van 1 ei OF 20ml kikkererwtwater",
    "Halve passievrucht"
  ]
}

let lastShownCocktail: CocktailRecipe | null = null;
let timeout: number | null = null;

function App() {
  const [timer, setTimer] = useState<number>(0);
  const [isShutterOpened, setIsShutterOpened] = useState<boolean>(false);
  const [currentCocktailRecipe, setCurrentCocktailRecipe] = useState<CocktailRecipe | null>(null);

  const socketUrl = 'ws://localhost:1337';
  
  useWebSocket(socketUrl, {
    onOpen: () => {
      console.log('opened');
    },
    onMessage: (event: MessageEvent) => {
      const messageParts = event.data.split(" ");

      try {
        switch(messageParts[0]) {
          case "pause": {
              const timerComponents = messageParts[1].split(':');
              const minutes = Number.parseInt(timerComponents[0]);
              const seconds = Number.parseInt(timerComponents[1]);
              const totalSeconds = minutes * 60 + seconds;
              if (timeout) {
                window.clearTimeout(timeout);
              }
              setTimeout(() => setTimer(totalSeconds), 1500);
              setCurrentCocktailRecipe(null);
              setIsShutterOpened(false);
          } break;
          case "continue":
            setTimer(0);
            if (timeout) {
              window.clearTimeout(timeout);
            }
            setIsShutterOpened(true);
          break;
          case "timer": {
            const timerComponents = messageParts[1].split(':');
            const minutes = Number.parseInt(timerComponents[0]);
            const seconds = Number.parseInt(timerComponents[1]);
            const totalSeconds = minutes * 60 + seconds;
            if (timeout) {
              window.clearTimeout(timeout);
            }
            setTimer(totalSeconds);
          } break;
          case "open":  
            setIsShutterOpened(true);
          break;
          case "close":  
            setIsShutterOpened(false);
          break;
          case "cocktail":  
            switch (messageParts[1]) {
              case "suikerwater":
                setCurrentCocktailRecipe(suikerwater);
                lastShownCocktail = suikerwater;
              break;
              case "espressomartini":
                setCurrentCocktailRecipe(espressoMartini);
                lastShownCocktail = espressoMartini;
              break;
              case "rockstarmartini":
                setCurrentCocktailRecipe(rockstarMartini);
                lastShownCocktail = rockstarMartini;
              break;
              case "null":
                setCurrentCocktailRecipe(null);
              break;
            }
          break;
        }
      } catch (e) {}
    },
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: (closeEvent) => true,
  });

  useEffect(() => {
    window.clearTimeout();
    timeout = window.setTimeout(() => {
      console.log('interval');
      if (timer > 0) {
        setTimer(timer - 1);
      }
    }, 1000);
  }, [timer]);

  useEffect(() => {
    anime.remove(['.shutter-wrapper .left', '.shutter-wrapper .right', '.top-right-logo img']);
    if (isShutterOpened) {
      anime({
        targets: '.shutter-wrapper .left',
        translateX: -1500,
        duration: 4000,
        easing: 'easeOutElastic(1, .8)'
      });

      anime({
        targets: '.shutter-wrapper .right',
        translateX: 1500,
        duration: 4000,
        easing: 'easeOutElastic(1, .8)'
      });

      setTimeout(() => {
        anime({
          targets: '.top-right-logo img',
          duration: 1000,
          scale: [0, 1],
          opacity: [0, 1]
        })
      }, 600);
    } else {
      // Close
      anime({
        targets: '.shutter-wrapper .left',
        translateX: '0',
        duration: 1000,
        easing: 'linear'
      });

      anime({
        targets: '.shutter-wrapper .right',
        translateX: '0',
        duration: 1000,
        easing: 'linear'
      });

      setTimeout(() => {
        anime({
          targets: '.top-right-logo img',
          duration: 1000,
          scale: [1, 0.1],
          opacity: [1, 0]
        })
      }, 100);
    }

  }, [isShutterOpened]);

  useEffect(() => {
    anime.remove(['.cocktail-recipe']);
    if (currentCocktailRecipe !== null) {
      anime({
        targets: '.cocktail-recipe',
        keyframes: [{
          left: -700
        }, {
          left: -80
        }],
        duration: 1500,
        easing: 'easeOutElastic(1, .8)'
      });
      anime({
        targets: '.cocktail-recipe .instructions',
        keyframes: [{
          left: -50
        }, {
          left: 0
        }],
        duration: 1600,
        easing: 'easeOutElastic(1, .8)'
      });
      anime({
        targets: '.cocktail-recipe .ingredients',
        keyframes: [{
          left: -100
        }, {
          left: 0
        }],
        duration: 1800,
        easing: 'easeOutElastic(1, .8)'
      });
    } else {
      anime({
        targets: '.cocktail-recipe',
        keyframes: [{
          left: -80
        }, {
          left: -60
        }, {
          left: -700
        }],
        duration: 1500,
        easing: 'easeOutElastic(1, .8)'
      });
      anime({
        targets: '.cocktail-recipe .instructions',
        keyframes: [{
          left: 0
        }, {
          left: 20
        }, {
          left: -50
        }],
        duration: 1600,
        easing: 'easeOutElastic(1, .8)'
      });
      anime({
        targets: '.cocktail-recipe .ingredients',
        keyframes: [{
          left: 0
        }, {
          left: 40
        }, {
          left: -80
        }],
        duration: 1800,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, [currentCocktailRecipe]);

  return (
    <>
      <div id="timer-wrapper">
        <div />
        {timer !== 0 && <span id="timer">
          {Math.floor(timer / 60).toString().padStart(2, "0")}:{(timer % 60).toString().padStart(2, "0")}
        </span>}
      </div>
      <div className="shutter-wrapper">
        <div className="right" />
        <div className="left">
          <img src="/logo.png" className="logo" alt="" />
        </div>
      </div>
      <div className="top-right-logo">
        <img src="/logo.png" alt="" />
      </div>
      <div className="cocktail-recipe-wrapper">
        <div className="cocktail-recipe">
          <div className="title">
            <span>{lastShownCocktail?.title}</span>
          </div>
          <div className="instructions">
            {lastShownCocktail?.instructions}
          </div>
          <div className="ingredients">
            <ul>
            {lastShownCocktail?.ingredients.map(ingredient => <li>{ingredient}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
