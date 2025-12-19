declare module '../../rust-core/nockchain_multisig.js' {
  export default function init(input?: string | URL | Request): Promise<void>;
  
  export function build_transaction(notes_json: string, outputs_json: string): string;
  export function get_spend_hash(tx_json: string, spend_index: number): string;
  export function add_signature(
    tx_json: string,
    spend_index: number,
    pubkey: string,
    signature: string
  ): string;
  export function get_spend_signing_status(tx_json: string, spend_index: number): string;
  export function validate_transaction(tx_json: string): string;
}
