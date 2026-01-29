const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFollyFix = (config) => {
    return withDangerousMod(config, [
        'ios',
        async (config) => {
            const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
            let podfileContent = fs.readFileSync(podfilePath, 'utf8');

            // Inyectar el flag en el post_install hook del Podfile
            const follyFlag = 'config.build_settings["OTHER_CPLUSPLUSFLAGS"] = ["$(inherited)", "-DFOLLY_CFG_NO_COROUTINES=1"]';

            if (!podfileContent.includes('-DFOLLY_CFG_NO_COROUTINES=1')) {
                // Buscamos el bloque post_install
                const postInstallMatch = /post_install do \|installer\|/g;
                if (postInstallMatch.test(podfileContent)) {
                    podfileContent = podfileContent.replace(
                        /post_install do \|installer\|/,
                        `post_install do |installer|\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |config|\n        ${follyFlag}\n      end\n    end`
                    );
                } else {
                    // Si no hay post_install, lo creamos al final
                    podfileContent += `\n\npost_install do |installer|\n  installer.pods_project.targets.each do |target|\n    target.build_configurations.each do |config|\n      ${follyFlag}\n    end\n  end\nend\n`;
                }
                fs.writeFileSync(podfilePath, podfileContent);
            }

            return config;
        },
    ]);
};

module.exports = withFollyFix;
