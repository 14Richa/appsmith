package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController extends BaseController<GitService, UserData, String> {

    @Autowired
    public GitController(GitService service) {
        super(service);
    }
}
