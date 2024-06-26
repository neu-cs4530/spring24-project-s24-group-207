import { Pizza, ToppingOptions } from '../../../../types/CoveyTownSocket';
import Image from 'next/image';
import PizzaPartyAreaController from '../../../../classes/interactable/PizzaPartyAreaController';
import React from 'react';

export type ToppingProps = {
  topping: ToppingOptions;
};

export default function Topping({ topping }: ToppingProps): JSX.Element {
  let imageSource = '';
  switch (topping) {
    case 'pepperoni':
      imageSource = '/assets/pizza-party/food-bins-toppings/pepperoni.png';
      break;
    case 'mushrooms':
      imageSource = '/assets/pizza-party/food-bins-toppings/mushroom.png';
      break;
    case 'anchovies':
      imageSource = '/assets/pizza-party/food-bins-toppings/anchovies.png';
      break;
    case 'olives':
      imageSource = '/assets/pizza-party/food-bins-toppings/olive.png';
      break;
    case 'onions':
      imageSource = '/assets/pizza-party/food-bins-toppings/onion.png';
      break;
    case 'peppers':
      imageSource = '/assets/pizza-party/food-bins-toppings/pepper.png';
      break;
    case 'sausage':
      imageSource = '/assets/pizza-party/food-bins-toppings/sausage.png';
      break;
    case 'cheese':
      imageSource = '/assets/pizza-party/food-bins-toppings/cheese.png';
      break;
    case 'sauce':
      imageSource = '/assets/pizza-party/food-bins-toppings/sauce.png';
      break;
  }

  return (
    <button>
      <div style={{ backgroundColor: 'silver' }}>
        <Image src={imageSource} alt={topping} width={20} height={40} unoptimized={true} />
      </div>
    </button>
  );
}
