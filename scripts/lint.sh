#!/bin/bash

cd /

yamllint -c $HOME/course-enrollment-project/.yamllint $HOME/course-enrollment-project/backend/studentApp/src/main/resources/config/
