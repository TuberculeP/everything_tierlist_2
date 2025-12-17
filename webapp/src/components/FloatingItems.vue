<template>
  <div
    ref="containerRef"
    class="absolute inset-0 overflow-hidden pointer-events-none"
  >
    <div
      v-for="item in floatingItems"
      :key="item.id"
      class="absolute px-3 py-1.5 bg-card/80 backdrop-blur-sm border rounded-full text-sm font-medium shadow-sm text-nowrap"
      :style="{
        left: `${item.x}px`,
        top: `${item.y}px`,
        transform: `translate(-50%, -50%) rotate(${item.angle}rad)`,
        opacity: item.opacity,
      }"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Matter from "matter-js";
import apiClient from "@/lib/utils/apiClient";

interface FloatingItem {
  id: number;
  name: string;
  x: number;
  y: number;
  angle: number;
  opacity: number;
}

const containerRef = ref<HTMLElement | null>(null);
const floatingItems = ref<FloatingItem[]>([]);

let engine: Matter.Engine;
let runner: Matter.Runner;
let bodies: Matter.Body[] = [];
let animationId: number;

function initPhysics(names: string[]) {
  if (!containerRef.value) return;

  const width = containerRef.value.offsetWidth;
  const height = containerRef.value.offsetHeight;

  engine = Matter.Engine.create({
    gravity: { x: 0, y: 0 },
  });

  const wallOptions = { isStatic: true, restitution: 1, friction: 0 };
  const wallThickness = 50;
  const walls = [
    Matter.Bodies.rectangle(
      width / 2,
      -wallThickness / 2,
      width,
      wallThickness,
      wallOptions,
    ),
    Matter.Bodies.rectangle(
      width / 2,
      height + wallThickness / 2,
      width,
      wallThickness,
      wallOptions,
    ),
    Matter.Bodies.rectangle(
      -wallThickness / 2,
      height / 2,
      wallThickness,
      height,
      wallOptions,
    ),
    Matter.Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height,
      wallOptions,
    ),
  ];

  bodies = names.map((name) => {
    const itemWidth = name.length * 8 + 24;
    const itemHeight = 32;

    const body = Matter.Bodies.rectangle(
      Math.random() * (width - 100) + 50,
      Math.random() * (height - 100) + 50,
      itemWidth,
      itemHeight,
      {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        frictionStatic: 0,
        label: name,
        chamfer: { radius: 16 },
      },
    );

    const speed = 1 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    Matter.Body.setVelocity(body, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });

    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);

    floatingItems.value.push({
      id: body.id,
      name,
      x: body.position.x,
      y: body.position.y,
      angle: body.angle,
      opacity: 0.35 + Math.random() * 0.2,
    });

    return body;
  });

  Matter.Composite.add(engine.world, [...walls, ...bodies]);

  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  function updatePositions() {
    bodies.forEach((body) => {
      const item = floatingItems.value.find((i) => i.id === body.id);
      if (item) {
        item.x = body.position.x;
        item.y = body.position.y;
        item.angle = body.angle;
      }

      const velocity = body.velocity;
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      const targetSpeed = 1.5;
      const tolerance = 0.3;

      if (speed < targetSpeed - tolerance || speed > targetSpeed + tolerance) {
        const factor = targetSpeed / Math.max(speed, 0.01);
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      }
    });

    animationId = requestAnimationFrame(updatePositions);
  }

  updatePositions();
}

async function fetchPopularItems() {
  const goodResult = await apiClient.get<{
    items: { name: string }[];
  }>("/items/leaderboard?limit=15&order=desc");
  const badResult = await apiClient.get<{
    items: { name: string }[];
  }>("/items/leaderboard?limit=15&order=asc");

  const result = [
    ...(goodResult.data?.items || []),
    ...(badResult.data?.items || []),
  ];

  const names = result.map((item) => item.name);

  initPhysics(names);
}

onMounted(() => {
  fetchPopularItems();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (runner) Matter.Runner.stop(runner);
  if (engine) Matter.Engine.clear(engine);
});
</script>
