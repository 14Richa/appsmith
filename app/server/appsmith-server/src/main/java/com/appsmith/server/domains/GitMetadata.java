package com.appsmith.server.domains;

import lombok.Data;

import java.util.Map;

// This class will be used for one-to-one mapping for the DB application and the application present in the
// git repo.
@Data
public class GitMetadata {
    // Git branch corresponding to this application
    String branchName;

    // Git remote url will be used while pushing and pulling changes
    Map<RemoteUrlType, String> remoteUrl;

    // If the current branch is the default one
    Boolean isDefault;

    // Default application id used for storing the application files in local volume :
    // container-volumes/git_repo/organizationId/defaultApplicationId/branchName/applicationDirectoryStructure...
    String defaultApplicationId;

    public enum RemoteUrlType {
        SSH,
        HTTPS
    }
}

