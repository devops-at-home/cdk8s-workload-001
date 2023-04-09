// generated by cdk8s
import { ApiObject, ApiObjectMetadata, GroupVersionKind } from 'cdk8s';
import { Construct } from 'constructs';


/**
 * NetworkAttachmentDefinition is a CRD schema specified by the Network Plumbing Working Group to express the intent for attaching pods to one or more logical or physical networks. More information available at: https://github.com/k8snetworkplumbingwg/multi-net-spec
 *
 * @schema NetworkAttachmentDefinition
 */
export class NetworkAttachmentDefinition extends ApiObject {
  /**
   * Returns the apiVersion and kind for "NetworkAttachmentDefinition"
   */
  public static readonly GVK: GroupVersionKind = {
    apiVersion: 'k8s.cni.cncf.io/v1',
    kind: 'NetworkAttachmentDefinition',
  }

  /**
   * Renders a Kubernetes manifest for "NetworkAttachmentDefinition".
   *
   * This can be used to inline resource manifests inside other objects (e.g. as templates).
   *
   * @param props initialization props
   */
  public static manifest(props: NetworkAttachmentDefinitionProps = {}): any {
    return {
      ...NetworkAttachmentDefinition.GVK,
      ...toJson_NetworkAttachmentDefinitionProps(props),
    };
  }

  /**
   * Defines a "NetworkAttachmentDefinition" API object
   * @param scope the scope in which to define this object
   * @param id a scope-local name for the object
   * @param props initialization props
   */
  public constructor(scope: Construct, id: string, props: NetworkAttachmentDefinitionProps = {}) {
    super(scope, id, {
      ...NetworkAttachmentDefinition.GVK,
      ...props,
    });
  }

  /**
   * Renders the object to Kubernetes JSON.
   */
  public toJson(): any {
    const resolved = super.toJson();

    return {
      ...NetworkAttachmentDefinition.GVK,
      ...toJson_NetworkAttachmentDefinitionProps(resolved),
    };
  }
}

/**
 * NetworkAttachmentDefinition is a CRD schema specified by the Network Plumbing Working Group to express the intent for attaching pods to one or more logical or physical networks. More information available at: https://github.com/k8snetworkplumbingwg/multi-net-spec
 *
 * @schema NetworkAttachmentDefinition
 */
export interface NetworkAttachmentDefinitionProps {
  /**
   * @schema NetworkAttachmentDefinition#metadata
   */
  readonly metadata?: ApiObjectMetadata;

  /**
   * NetworkAttachmentDefinition spec defines the desired state of a network attachment
   *
   * @schema NetworkAttachmentDefinition#spec
   */
  readonly spec?: NetworkAttachmentDefinitionSpec;

}

/**
 * Converts an object of type 'NetworkAttachmentDefinitionProps' to JSON representation.
 */
/* eslint-disable max-len, quote-props */
export function toJson_NetworkAttachmentDefinitionProps(obj: NetworkAttachmentDefinitionProps | undefined): Record<string, any> | undefined {
  if (obj === undefined) { return undefined; }
  const result = {
    'metadata': obj.metadata,
    'spec': toJson_NetworkAttachmentDefinitionSpec(obj.spec),
  };
  // filter undefined values
  return Object.entries(result).reduce((r, i) => (i[1] === undefined) ? r : ({ ...r, [i[0]]: i[1] }), {});
}
/* eslint-enable max-len, quote-props */

/**
 * NetworkAttachmentDefinition spec defines the desired state of a network attachment
 *
 * @schema NetworkAttachmentDefinitionSpec
 */
export interface NetworkAttachmentDefinitionSpec {
  /**
   * NetworkAttachmentDefinition config is a JSON-formatted CNI configuration
   *
   * @schema NetworkAttachmentDefinitionSpec#config
   */
  readonly config?: string;

}

/**
 * Converts an object of type 'NetworkAttachmentDefinitionSpec' to JSON representation.
 */
/* eslint-disable max-len, quote-props */
export function toJson_NetworkAttachmentDefinitionSpec(obj: NetworkAttachmentDefinitionSpec | undefined): Record<string, any> | undefined {
  if (obj === undefined) { return undefined; }
  const result = {
    'config': obj.config,
  };
  // filter undefined values
  return Object.entries(result).reduce((r, i) => (i[1] === undefined) ? r : ({ ...r, [i[0]]: i[1] }), {});
}
/* eslint-enable max-len, quote-props */
