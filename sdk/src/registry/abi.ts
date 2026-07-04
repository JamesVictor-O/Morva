/** Matches the not-yet-deployed MorvaRegistry contract (contracts/). */
export const MORVA_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerMerchant",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "cfg",
        type: "tuple",
        components: [
          { name: "settlementToken", type: "address" },
          { name: "settlementRecipient", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateMerchant",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "cfg",
        type: "tuple",
        components: [
          { name: "settlementToken", type: "address" },
          { name: "settlementRecipient", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setActive",
    stateMutability: "nonpayable",
    inputs: [{ name: "active", type: "bool" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getMerchant",
    stateMutability: "view",
    inputs: [{ name: "merchant", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "settlementToken", type: "address" },
          { name: "settlementRecipient", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "MerchantRegistered",
    inputs: [
      { name: "merchant", type: "address", indexed: true },
      { name: "settlementToken", type: "address", indexed: false },
      { name: "settlementRecipient", type: "address", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MerchantUpdated",
    inputs: [{ name: "merchant", type: "address", indexed: true }],
  },
] as const;
