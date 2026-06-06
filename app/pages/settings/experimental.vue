<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="实验"
      description="实验功能会在有可试用能力时显示。"
    />

    <SettingsPanel
      icon="flask-conical"
      title="没有可用的实验功能"
      description="当前版本没有需要通过实验开关保护的功能。"
    >
      <PageState
        icon="flask-conical"
        title="干净得很"
        description="后续如有新播放器、搜索或上传工作流实验，会放到这里集中管理。"
      />
    </SettingsPanel>
  </div>
</template>
