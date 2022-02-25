import * as semver from "semver";
import { ConfigurationTarget } from "./interfaces/ConfigurationTarget";
import { UserConfiguration } from "./interfaces/UserConfiguration";
import { WorkspaceConfiguration } from "./interfaces/WorkspaceConfiguration";

interface OnOutdatedParams {
  message: string;
  openSettingsChoice: string;
  upgradeChoice: string;
  dismissChoice: string;
  upgrade: () => void;
}

interface UpdateConfigParams {
  configSection: string;
  latestServerVersion: string;
  configurationTarget: ConfigurationTarget;
}

const configSection = UserConfiguration.ServerVersion;

interface CheckServerVersionParams {
  config: WorkspaceConfiguration;
  updateConfig: (params: UpdateConfigParams) => void;
  onOutdated: (params: OnOutdatedParams) => void;
}

export async function checkServerVersion({
  config,
  updateConfig,
  onOutdated,
}: CheckServerVersionParams) {
  const { serverVersion, latestServerVersion, configurationTarget } =
    serverVersionInfo(config);
  const isOutdated = (() => {
    try {
      return semver.lt(serverVersion, latestServerVersion);
    } catch (_e) {
      // serverVersion has an invalid format
      // ignore the exception here, and let subsequent checks handle this
      return false;
    }
  })();

  if (isOutdated) {
    const message = `You are running an out-of-date version of Metals. The latest version is ${latestServerVersion}, but you have configured a custom server version ${serverVersion}`;
    const upgradeChoice = `Upgrade to ${latestServerVersion} now`;
    const openSettingsChoice = "Open settings";
    const dismissChoice = "Not now";
    const upgrade = () =>
      updateConfig({ configSection, latestServerVersion, configurationTarget });

    onOutdated({
      message,
      upgradeChoice,
      openSettingsChoice,
      dismissChoice,
      upgrade,
    });
  }
}

function serverVersionInfo(config: WorkspaceConfiguration): {
  serverVersion: string;
  latestServerVersion: string;
  configurationTarget: ConfigurationTarget;
} {
  const computedVersion = config.get<string>(configSection)!;
  const { defaultValue, globalValue, workspaceValue } =
    config.inspect<string>(configSection)!;
  const configurationTarget = (() => {
    if (globalValue && globalValue !== defaultValue) {
      return ConfigurationTarget.Global;
    }
    if (workspaceValue && workspaceValue !== defaultValue) {
      return ConfigurationTarget.Workspace;
    }
    return ConfigurationTarget.Workspace;
  })();
  return {
    serverVersion: computedVersion,
    latestServerVersion: defaultValue!,
    configurationTarget,
  };
}
