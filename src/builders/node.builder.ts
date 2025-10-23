import { BinaryNode, ButtonType } from '../types';
import { NATIVE_FLOW_SPECIALS } from '../constants';

export function getButtonType(message: any): ButtonType {
  if (message.listMessage) return 'list';
  if (message.buttonsMessage) return 'buttons';
  if (message.interactiveMessage?.nativeFlowMessage) return 'native_flow';
  return null;
}

export function getButtonArgs(message: any): BinaryNode {
  const nativeFlow = message.interactiveMessage?.nativeFlowMessage;
  const firstButtonName = nativeFlow?.buttons?.[0]?.name;

  if (nativeFlow && (firstButtonName === 'review_and_pay' || firstButtonName === 'payment_info')) {
    return {
      tag: 'biz',
      attrs: {
        native_flow_name: firstButtonName === 'review_and_pay' ? 'order_details' : firstButtonName
      }
    };
  }

  if (nativeFlow && NATIVE_FLOW_SPECIALS.includes(firstButtonName)) {
    return {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'interactive',
          attrs: { type: 'native_flow', v: '1' },
          content: [
            {
              tag: 'native_flow',
              attrs: { v: '2', name: firstButtonName }
            }
          ]
        }
      ]
    };
  }

  if (nativeFlow || message.buttonsMessage) {
    return {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'interactive',
          attrs: { type: 'native_flow', v: '1' },
          content: [
            {
              tag: 'native_flow',
              attrs: { v: '9', name: 'mixed' }
            }
          ]
        }
      ]
    };
  }

  if (message.listMessage) {
    return {
      tag: 'biz',
      attrs: {},
      content: [
        {
          tag: 'list',
          attrs: { v: '2', type: 'product_list' }
        }
      ]
    };
  }

  return { tag: 'biz', attrs: {} };
}