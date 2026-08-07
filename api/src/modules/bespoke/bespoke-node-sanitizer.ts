import type {
  EngineState,
  FluencyTier,
  Option,
  QuestionNode,
} from '@ishraqparfums/bespoke-engine';
import { isAct3Render } from '@ishraqparfums/bespoke-engine';
import type {
  BespokePublicNode,
  BespokePublicOption,
} from '@ishraqparfums/shared';

const GIFT_FLAGS = ['gift', 'gift_intent'];

/**
 * Everything the engine reasons with — an option's vector, modifiers,
 * constraint payload, backend effects, fluency points, output choice and
 * routing — stays on the server. What a customer receives is the question,
 * the choices, and the acknowledgements written for them.
 *
 * `note_to_perfumer` is the one conditional: it is bench language, released
 * only to a customer who asked to be spoken to as a perfumer.
 */
function toPublicOption(
  option: Option,
  tier: FluencyTier | null,
): BespokePublicOption {
  const publicOption: BespokePublicOption = {
    id: option.id,
    label: option.label,
  };

  if (option.flags?.length) publicOption.flags = [...option.flags];
  if (option.highlight) publicOption.highlight = option.highlight;
  if (option.echo) publicOption.echo = option.echo;
  if (option.exclusive) publicOption.exclusive = true;
  if (option.followup_free_text) {
    publicOption.followup_free_text = option.followup_free_text;
  }
  if (option.fluency_tier) publicOption.fluency_tier = option.fluency_tier;
  if (tier === 'perfumer' && option.note_to_perfumer) {
    publicOption.note_to_perfumer = option.note_to_perfumer;
  }

  return publicOption;
}

/** A1's gift branches swap the second-person phrasing on later questions. */
function resolveText(
  node: QuestionNode,
  state: EngineState,
): string | undefined {
  const isGift = state.flags.some((flag) => GIFT_FLAGS.includes(flag));
  if (isGift && 'text_gift' in node && node.text_gift) {
    return node.text_gift;
  }
  return 'text' in node ? node.text : undefined;
}

export function toPublicNode(
  nodeId: string,
  node: QuestionNode,
  state: EngineState,
  generatedNames?: string[],
): BespokePublicNode {
  if (isAct3Render(node)) {
    return {
      id: nodeId,
      act: node.act,
      layer: node.layer,
      type: 'act3_render',
      blocks: node.blocks.map((block) => ({
        id: block.id,
        heading: block.heading,
        content: block.content,
        ...(block.copy ? { copy: block.copy } : {}),
      })),
    };
  }

  if (node.type === 'conditional_router') {
    throw new Error(
      `Router node "${nodeId}" is internal plumbing and must never be rendered`,
    );
  }

  const base: BespokePublicNode = {
    id: nodeId,
    act: node.act,
    layer: node.layer,
    type: node.type,
  };

  const text = resolveText(node, state);
  if (text) base.text = text;
  if (node.disclosure_copy) base.disclosure_copy = node.disclosure_copy;

  switch (node.type) {
    case 'single_select':
    case 'multi_select':
      base.options = node.options.map((option) =>
        toPublicOption(option, state.fluencyTier),
      );
      break;

    case 'free_text':
      if (node.optional) base.optional = true;
      break;

    case 'name_entry':
      base.fields = {
        perfume_name: {
          min: node.fields.perfume_name.min,
          max: node.fields.perfume_name.max,
          required: node.fields.perfume_name.required,
        },
        dedication: {
          min: node.fields.dedication.min,
          max: node.fields.dedication.max,
          required: node.fields.dedication.required,
          ...(node.fields.dedication.placeholder
            ? { placeholder: node.fields.dedication.placeholder }
            : {}),
        },
      };
      if (node.offer_generated_names) {
        base.offer_generated_names = node.offer_generated_names;
      }
      if (generatedNames?.length) base.generatedNames = generatedNames;
      break;

    case 'candidate_select':
      base.min_candidates = node.min_candidates;
      base.max_candidates = node.max_candidates;
      break;

    case 'catalogue_select':
      base.sentiment = node.sentiment;
      if (node.optional) base.optional = true;
      if (node.skip_label) base.skip_label = node.skip_label;
      break;
  }

  return base;
}

/** The plain question text, for the event log — never shown to the customer. */
export function nodeText(node: QuestionNode): string {
  return 'text' in node && node.text ? node.text : '';
}
