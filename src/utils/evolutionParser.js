function extractIdFromUrl(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function describeEvolutionDetail(detail) {
  const trigger = detail.trigger ? detail.trigger.name : null;
  const parts = [];

  switch (trigger) {
    case 'level-up':
      if (detail.min_level) {
        parts.push(`Subir al nivel ${detail.min_level}`);
      } else {
        parts.push('Subir de nivel');
      }
      if (detail.min_happiness)
        parts.push(`con felicidad >= ${detail.min_happiness}`);
      if (detail.min_beauty) parts.push(`con belleza >= ${detail.min_beauty}`);
      if (detail.min_affection)
        parts.push(`con afecto >= ${detail.min_affection}`);
      if (detail.time_of_day)
        parts.push(
          `durante el ${detail.time_of_day === 'day' ? 'día' : 'la noche'}`,
        );
      if (detail.known_move)
        parts.push(`conociendo el movimiento ${detail.known_move.name}`);
      if (detail.known_move_type)
        parts.push(
          `conociendo un movimiento de tipo ${detail.known_move_type.name}`,
        );
      if (detail.location)
        parts.push(`en la ubicación ${detail.location.name}`);
      if (detail.held_item)
        parts.push(`sosteniendo el objeto ${detail.held_item.name}`);
      if (detail.relative_physical_stats === 1)
        parts.push('cuando Ataque > Defensa');
      if (detail.relative_physical_stats === -1)
        parts.push('cuando Defensa > Ataque');
      if (detail.relative_physical_stats === 0)
        parts.push('cuando Ataque = Defensa');
      if (detail.needs_overworld_rain) parts.push('mientras llueve');
      if (detail.turn_upside_down) parts.push('girando la consola/dispositivo');
      break;

    case 'trade':
      parts.push('Intercambiar el Pokémon');
      if (detail.held_item)
        parts.push(`sosteniendo el objeto ${detail.held_item.name}`);
      if (detail.trade_species) parts.push(`por ${detail.trade_species.name}`);
      break;

    case 'use-item':
      parts.push(
        `Usar el objeto ${detail.item ? detail.item.name : 'desconocido'}`,
      );
      break;

    case 'shed':
      parts.push(
        'Evolución especial (deja un espacio libre en el equipo y una Pokéball extra)',
      );
      break;

    case 'spin':
      parts.push('Girar mientras sostiene el objeto correspondiente');
      break;

    case 'tower-of-darkness':
      parts.push('Subir de nivel en la Torre de la Oscuridad');
      break;

    case 'tower-of-waters':
      parts.push('Subir de nivel en la Torre del Agua');
      break;

    case 'three-critical-hits':
      parts.push('Asestar 3 golpes críticos en un mismo combate');
      break;

    case 'take-damage':
      parts.push('Recibir cierta cantidad de daño y luego subir de nivel');
      break;

    case 'other':
      parts.push('Método especial (ver detalles adicionales)');
      break;

    default:
      parts.push(trigger ? `Disparador: ${trigger}` : 'Método desconocido');
  }

  if (detail.item) {
    if (trigger !== 'use-item')
      parts.push(`usando el objeto ${detail.item.name}`);
  }

  if (detail.gender) {
    parts.push(detail.gender === 1 ? 'solo en hembras' : 'solo en machos');
  }

  return parts.join(', ');
}

function buildEvolutionNode(chainLink) {
  const speciesId = extractIdFromUrl(chainLink.species.url);

  return {
    id: speciesId,
    name: chainLink.species.name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`,
    evolvesTo: chainLink.evolves_to.map(nextLink => ({
      ...buildEvolutionNode(nextLink),
      evolutionMethods: nextLink.evolution_details.map(describeEvolutionDetail),
    })),
  };
}

function parseEvolutionChain(rawChainResponse) {
  return buildEvolutionNode(rawChainResponse.chain);
}

function flattenEvolutionChain(node, stage = 1, path = []) {
  const currentPath = [...path, { id: node.id, name: node.name, stage }];
  let flatList = [{ id: node.id, name: node.name, sprite: node.sprite, stage }];

  node.evolvesTo.forEach(child => {
    flatList.push({
      id: child.id,
      name: child.name,
      sprite: child.sprite,
      stage: stage + 1,
      evolvesFrom: node.name,
      evolutionMethods: child.evolutionMethods,
    });
    flatList = flatList.concat(
      flattenEvolutionChain(child, stage + 1, currentPath).slice(1),
    );
  });

  return flatList;
}

module.exports = {
  parseEvolutionChain,
  flattenEvolutionChain,
  extractIdFromUrl,
  describeEvolutionDetail,
};
