import {
  ConnectWalletStep,
  MintStep,
  ProveStep,
  SuccessStep,
  WelcomeScreen,
  InstallExtension,
} from "../components";

export type Step = {
  kind: STEP_KIND;
  path: string;
  backUrl?: string;
  component: React.ComponentType;
  title: string;
  description: string;
  headerIcon?: string;
  index: number;
};

export enum STEP_KIND {
  WELCOME,
  CONNECT_WALLET,
  START_PROVING,
  MINT,
  INSTALL_EXTENSION,
  SUCCESS,
}

export const steps: Step[] = [
  {
    path: "",
    kind: STEP_KIND.WELCOME,
    component: WelcomeScreen,
    title: "Revolut Balance Proof",
    description:
      "Prove you have more than 40€ in your Revolut account and mint an NFT. Only you can prove your balance. This example demonstrates use of Web Proofs for financial verification.",
    headerIcon: "/revolut-illustration.svg",
    index: 0,
  },
  {
    path: "connect-wallet",
    kind: STEP_KIND.CONNECT_WALLET,
    backUrl: "",
    component: ConnectWalletStep,
    title: "Revolut Balance Proof",
    description:
      "To proceed to the next step, please connect your wallet now by clicking the button below.",
    index: 1,
  },
  {
    path: "start-proving",
    kind: STEP_KIND.START_PROVING,
    backUrl: "/connect-wallet",
    component: ProveStep,
    title: "Revolut Balance Proof",
    description:
      "Open vlayer browser extension and follow instructions to produce the Proof of your Revolut balance (more than 40€). \n",
    index: 2,
  },
  {
    path: "install-extension",
    kind: STEP_KIND.INSTALL_EXTENSION,
    component: InstallExtension,
    backUrl: "/connect-wallet",
    title: "Revolut Balance Proof",
    description: `Install vlayer browser extension to proceed to the next step. \n`,
    index: 2,
  },
  {
    path: "mint",
    kind: STEP_KIND.MINT,
    backUrl: "/start-proving",
    component: MintStep,
    title: "Revolut Balance Proof",
    description: `You are all set to mint your unique Revolut Balance NFT, proving you have more than 40€.`,
    index: 3,
  },
  {
    path: "success",
    kind: STEP_KIND.SUCCESS,
    component: SuccessStep,
    title: "Success",
    description: "",
    headerIcon: "/success-illustration.svg",
    index: 4,
  },
];
