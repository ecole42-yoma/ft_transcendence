import React from "react";
import { PressKey } from "../../event/pressKey";
import { GameCoordinateAtom, GameCoordinate, GameCanvas } from "../atom/GameAtom";
import { me, opponent, net, ball, HEIGHT, WIDTH } from "./GameInfo";
import { useAtom } from "jotai";

function drawRect(
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  context: CanvasRenderingContext2D
) {
  if (context) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
  }
}

function drawCircle(
  x: number,
  y: number,
  r: number,
  color: string,
  context: CanvasRenderingContext2D
) {
  if (context) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
  }
}

function drawText(
  text: number,
  x: number,
  y: number,
  color: string,
  context: CanvasRenderingContext2D
) {
  if (context) {
    context.fillStyle = color;
    context.font = "50px Arial";
    context.fillText(text.toString(), x, y);
  }
}

function drawNet(context: CanvasRenderingContext2D) {
  for (let i = 0; i <= HEIGHT; i += 40) {
    drawRect(net.x, net.y + i, net.width, net.height, net.color, context);
  }
}

export function Game(gameInfo: GameCoordinate, canvas: React.RefObject<HTMLCanvasElement>) {
  const canv = canvas.current;
  const context = canv?.getContext("2d");
  // console.log(`gameInfo: ${JSON.stringify(gameInfo)}`);
  if (context) {
    context.clearRect(0, 0, 1150, 600);
    drawRect(0, 0, 1150, 600, "black", context);
    //net
    drawNet(context);
    //bar
    drawRect(me.x, gameInfo.paddle1Y, me.width, me.height, me.color, context);
    drawRect(opponent.x, gameInfo.paddle2Y, opponent.width, opponent.height, opponent.color, context);
    //ball
    drawCircle(gameInfo.ballX, gameInfo.ballY, ball.radius, ball.color, context);
    //score
    drawText(me.score, WIDTH / 4, 50, "WHITE", context);
    drawText(opponent.score, 3 * (WIDTH / 4), 50, "WHITE", context);
  }
}
