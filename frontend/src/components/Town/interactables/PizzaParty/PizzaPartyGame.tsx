import React, { useEffect, useRef, useState } from 'react';
import { Pizza, Pizza as PizzaType } from '../../../../types/CoveyTownSocket';
import Image from 'next/image';
import PizzaPartyAreaController from '../../../../classes/interactable/PizzaPartyAreaController';
import PizzaSprite from './Pizza';
import Customer from './Customer';
import {
  Customer as CustomerType,
  Topping as ToppingType,
} from '../../../../types/CoveyTownSocket';
import Topping from './Topping';
import { ToppingOptions } from '../../../../types/CoveyTownSocket';
import ToppingTray from './ToppingTray';
import Oven from './Oven';
import Trash from './Trash';
import { chakra, Container } from '@chakra-ui/react';
import OvenButton from './OvenButton';

export type PizzaPartyGameProps = {
  gameAreaController: PizzaPartyAreaController;
};

/**
 * A component that renders the Pizza Party game
 */
const StyledPizzaGameBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    width: '40vw',
    height: '40vh',
    padding: '5px',
    flexWrap: 'wrap',
  },
});

const TOPPINGS_LIST: ToppingOptions[] = [
  'pepperoni',
  'mushrooms',
  'anchovies',
  'olives',
  'onions',
  'peppers',
  'sausage',
];

// To-Do: Add controller functionality in here
export default function PizzaPartyGame({ gameAreaController }: PizzaPartyGameProps): JSX.Element {
  const [currentCustomers, setCurrentCustomers] = useState(gameAreaController.currentCustomers);
  const [currentPizza, setCurrentPizza] = useState<Pizza | undefined>(
    gameAreaController.currentPizza,
  );
  const [currentToppings, setCurrentToppings] = useState<ToppingType[] | undefined>(
    currentPizza?.toppings,
  );
  const [currentScore, setCurrentScore] = useState(gameAreaController.currentScore);
  const [currentGame, setCurrentGame] = useState(gameAreaController.game);

  const currentCustomersRef = useRef(currentCustomers);

  useEffect(() => {
    currentCustomersRef.current = currentCustomers;
  }, [currentCustomers]);

  useEffect(() => {
    gameAreaController.addListener('customerChanged', setCurrentCustomers);

    const intervalId = setInterval(() => {
      if (currentCustomersRef.current && currentCustomersRef.current.length >= 3) {
        clearInterval(intervalId);
      } else {
        const index = gameAreaController.findEmptySeat();
        if (
          index !== -1 &&
          index !== undefined &&
          currentCustomersRef.current !== undefined &&
          gameAreaController.currentCustomers !== undefined
        ) {
          const newCustomers = [...currentCustomersRef.current];
          const customer = gameAreaController.generateRandomCustomer();
          newCustomers[index] = customer;
          gameAreaController.currentCustomers[index] = customer;
          setCurrentCustomers(newCustomers);
        }
      }
    }, 3000);

    return () => {
      gameAreaController.removeListener('customerChanged', setCurrentCustomers);
      clearInterval(intervalId);
    };
  }, [gameAreaController]);

  useEffect(() => {
    gameAreaController.addListener('pizzaChanged', setCurrentPizza);
    gameAreaController.addListener('scoreChanged', setCurrentScore);
    gameAreaController.addListener('gameChanged', setCurrentGame);
    return () => {
      gameAreaController.removeListener('customerChanged', setCurrentCustomers);
      gameAreaController.removeListener('pizzaChanged', setCurrentPizza);
      gameAreaController.removeListener('scoreChanged', setCurrentScore);
      gameAreaController.removeListener('gameChanged', setCurrentGame);
    };
  }, [currentGame, currentPizza, gameAreaController, currentScore]);

  function applyTopping(topp: ToppingOptions): void {
    const top = {
      id: Math.floor(Math.random() * 1000),
      kind: topp,
      appliedOnPizza: false,
    };
    gameAreaController.makeMove({
      topping: top,
      pizza: currentPizza,
      customer: undefined,
      gamePiece: 'placeTopping',
    });
  }
  function handleTrashClick(): void {
    console.log('Trash clicked');
    gameAreaController.makeMove({
      gamePiece: 'throwOut',
      pizza: currentPizza,
      customer: undefined,
    });
  }
  function bakeCurrentPizza(): void {
    gameAreaController.makeMove({
      topping: undefined,
      pizza: currentPizza,
      customer: undefined,
      gamePiece: 'moveToOven',
    });
  }
  function giveToCustomer(cust: CustomerType): void {
    console.log('give to customer');
    gameAreaController.makeMove({
      topping: undefined,
      pizza: currentPizza,
      customer: cust,
      gamePiece: 'moveToCustomer',
    });

    const index = currentCustomers?.findIndex(c => c.id === cust.id);
    console.log(cust.order.pizzas[0].toppings);
    console.log(currentPizza?.toppings);
    if (
      gameAreaController.sameToppings(cust.order.pizzas[0].toppings, currentPizza?.toppings) &&
      currentCustomers !== undefined &&
      index !== undefined &&
      gameAreaController.currentCustomers !== undefined
    ) {
      cust.completed = true;
      if (currentScore !== undefined) {
        setCurrentScore(currentScore + 1);
      }
      console.log('replace customer');
      const newCustomers = [...currentCustomers];
      const empty = gameAreaController.generateEmptyCustomer();
      newCustomers[index] = empty;
      gameAreaController.currentCustomers[index] = empty;
      setCurrentCustomers(newCustomers);
      handleTrashClick();
    }
  }
  return (
    <StyledPizzaGameBoard>
      <Image
        src={'/assets/pizza-party/background.png'}
        alt='Pizza Party Game'
        layout='fill'
        style={{ position: 'absolute', top: 0, left: 0 }}
        unoptimized={true}
      />
      <div style={{ position: 'absolute', top: 425, left: 50, width: '100%', height: '100%' }}>
        <PizzaSprite pizza={currentPizza} toppings={currentPizza?.toppings} />
      </div>
      <div style={{ display: 'flex', position: 'absolute', left: 7, top: 100 }}>
        {currentCustomers?.map((customer, index) =>
          customer.name !== 'Empty' ? (
            <button
              style={{ marginRight: 30, zIndex: 999 }}
              key={index}
              onClick={() => giveToCustomer(customer)}>
              <Customer customer={customer} game={gameAreaController} />
            </button>
          ) : (
            <div style={{ marginRight: 30 }} key={index}></div>
          ),
        )}
      </div>
      <div style={{ position: 'absolute', top: 430, left: 250 }}>
        <OvenButton onClick={() => bakeCurrentPizza()} />
      </div>
      <div style={{ position: 'absolute', top: 430, left: 410 }}>
        <Trash onClick={() => handleTrashClick()} />
      </div>
      <div style={{ display: 'flex', position: 'absolute', left: 7, top: 350 }}>
        {TOPPINGS_LIST.map((topping, index) => {
          return (
            <div key={index} style={{ marginRight: 30 }} onClick={() => applyTopping(topping)}>
              <ToppingTray topping={topping} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', top: 400 }}>
        <div onClick={() => applyTopping('sauce')}>
          <ToppingTray topping={'sauce'} />
        </div>
        <div onClick={() => applyTopping('cheese')}>
          <ToppingTray topping={'cheese'} />
        </div>
      </div>
    </StyledPizzaGameBoard>
  );
}
