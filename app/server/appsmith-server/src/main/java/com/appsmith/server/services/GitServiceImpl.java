package com.appsmith.server.services;

import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class GitServiceImpl extends BaseService<UserDataRepository, UserData, String> implements GitService {

    private final UserService userService;

    private final UserDataService userDataService;

    private final SessionUserService sessionUserService;

    public GitServiceImpl(Scheduler scheduler,
                          Validator validator,
                          MongoConverter mongoConverter,
                          ReactiveMongoTemplate reactiveMongoTemplate,
                          UserDataRepository repository,
                          AnalyticsService analyticsService,
                          UserService userService,
                          UserDataService userDataService,
                          SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.userService = userService;
        this.userDataService = userDataService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<UserData> saveGitConfigData(GitConfig gitConfig) {
        if(gitConfig.getProfileName() == null || gitConfig.getProfileName().length() == 0) {
            return Mono.error( new AppsmithException( AppsmithError.INVALID_PARAMETER, "Profile Name", ""));
        }
        return userService.findByEmail(gitConfig.getUserName())
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {

                            /*
                            *  The gitConfig will be null if the user has not created profiles.
                            *  If null then we need to create this field for the currentUser and save the profile data
                            *  Else, append the
                            * */

                            if( Optional.ofNullable(userData.getGitLocalConfigData()).isEmpty() ) {
                                List<GitConfig> gitConfigs = new ArrayList<>();
                                gitConfigs.add(gitConfig);
                                userData.setGitLocalConfigData(gitConfigs);
                                return userDataService.updateForUser(user, userData);
                            } else {
                                return isProfileNameExists(user.getId(), gitConfig.getProfileName())
                                        .flatMap(isProfile -> {
                                            if(isProfile) {
                                                return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                                        "Profile Name - " + gitConfig.getProfileName(),
                                                        "Profile Name.",
                                                        null));
                                            } else {
                                                List<GitConfig> gitConfigs = new ArrayList<>();
                                                gitConfigs.add(gitConfig);
                                                userData.setGitLocalConfigData(gitConfigs);
                                                return userDataService.updateForUser(user, userData);
                                            }
                                        });
                            }
                        }));
    }

    private Mono<Boolean> isProfileNameExists(String userId, String name) {
        return userDataService.findByProfileName(userId, name)
                .flatMap(count -> {
                    if(count == null) {
                        return Mono.just(false);
                    } else {
                        return Mono.just(true);
                    }
                });
    }

    @Override
    public Mono<UserData> updateGitConfigData(GitConfig gitConfig) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService.updateGitConfigProfile(user, gitConfig));
    }
}
